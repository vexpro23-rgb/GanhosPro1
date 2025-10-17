import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps, Cell } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import type { GanhosProStore } from '../../types.ts';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from '../Icons.tsx';

// Props
interface PerformanceOptimizerProps {
    store: GanhosProStore;
    RenderInsightsComponent: React.FC<{ text: string }>;
}

// Reusable UI Components
const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-night-900/50 p-3 rounded-lg text-center flex-grow">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
    </div>
);

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-night-900/80 backdrop-blur-sm p-3 rounded-lg border border-night-600 shadow-lg text-sm">
                <p className="font-bold text-white mb-2">{`${data.day}, ${label}`}</p>
                <p className={`text-base font-semibold ${data.Lucro > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {`Lucro: ${formatCurrency(data.Lucro)}`}
                </p>
            </div>
        );
    }
    return null;
};

// Date Helper Functions
const getWeekRange = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { start: startOfWeek, end: endOfWeek };
};

const getMonthRange = (d: Date) => {
    const date = new Date(d);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    return { start: startOfMonth, end: endOfMonth };
};

const formatPeriodLabel = (start: Date, end: Date, periodType: 'week' | 'month') => {
    if (periodType === 'week') {
        const startMonth = start.toLocaleString('pt-BR', { month: 'short'});
        const endMonth = end.toLocaleString('pt-BR', { month: 'short'});
        if (startMonth === endMonth) {
             return `${start.toLocaleDateString('pt-BR', { day: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
        }
        return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else { // month
        return start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
};

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Main Component
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ store, RenderInsightsComponent }) => {
    const [periodType, setPeriodType] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleDateChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (periodType === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        } else { // month
            newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
        }
        setCurrentDate(newDate);
        setAiInsights(''); // Clear insights when period changes
        setError('');
    };

    const periodData = useMemo(() => {
        const { start, end } = periodType === 'week' ? getWeekRange(currentDate) : getMonthRange(currentDate);
        
        const filteredEntries = store.entries.filter(e => {
            const entryDate = new Date(e.date);
            entryDate.setMinutes(entryDate.getMinutes() + entryDate.getTimezoneOffset()); // Adjust for timezone
            return entryDate >= start && entryDate <= end;
        });

        const dailyData = new Map<string, { totalProfit: number, totalKm: number, totalHours: number, count: number }>();
        
        filteredEntries.forEach(entry => {
            const date = new Date(entry.date);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Adjust for timezone
            const dateKey = date.toISOString().split('T')[0];

            const netProfit = entry.totalEarnings - (entry.kmDriven * store.vehicleCostPerKm) - entry.additionalCosts;

            const current = dailyData.get(dateKey) || { totalProfit: 0, totalKm: 0, totalHours: 0, count: 0 };
            current.totalProfit += netProfit;
            current.totalKm += entry.kmDriven;
            current.totalHours += entry.hoursWorked;
            current.count += 1;
            dailyData.set(dateKey, current);
        });
        
        const chartData = Array.from(dailyData.entries()).map(([dateStr, data]) => {
            const date = new Date(dateStr);
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
            return {
                name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                day: date.toLocaleDateString('pt-BR', { weekday: 'short'}),
                Lucro: parseFloat(data.totalProfit.toFixed(2))
            };
        }).sort((a,b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime());

        const totalProfit = filteredEntries.reduce((acc, e) => acc + (e.totalEarnings - (e.kmDriven * store.vehicleCostPerKm) - e.additionalCosts), 0);
        const totalHours = filteredEntries.reduce((acc, e) => acc + e.hoursWorked, 0);
        const totalKm = filteredEntries.reduce((acc, e) => acc + e.kmDriven, 0);

        return {
            start,
            end,
            filteredEntries,
            chartData,
            stats: {
                totalProfit,
                avgProfitPerDay: dailyData.size > 0 ? totalProfit / dailyData.size : 0,
                profitPerHour: totalHours > 0 ? totalProfit / totalHours : 0,
                daysWorked: dailyData.size,
                totalKm
            }
        };

    }, [currentDate, periodType, store.entries, store.vehicleCostPerKm]);

    const handleGenerateInsights = async () => {
        if (periodData.filteredEntries.length < 2) {
            setError("São necessários pelo menos 2 registros no período selecionado para gerar uma análise.");
            return;
        }

        setIsLoading(true);
        setError('');
        setAiInsights('');
        
        const dataSummary = periodData.chartData.map(d => `Data: ${d.name} (${d.day}), Lucro: ${formatCurrency(d.Lucro)}`).join('\n');

        const prompt = `
            Você é um analista de dados especialista em otimizar o desempenho de motoristas de aplicativo.
            Analise os dados do seguinte período: **${formatPeriodLabel(periodData.start, periodData.end, periodType)}**.

            **Resumo do Período:**
            - Lucro Total: ${formatCurrency(periodData.stats.totalProfit)}
            - Lucro Médio por Dia Trabalhado: ${formatCurrency(periodData.stats.avgProfitPerDay)}
            - Lucro por Hora: ${formatCurrency(periodData.stats.profitPerHour)}
            - KM Rodados: ${periodData.stats.totalKm.toFixed(1)} km
            - Custo por KM do motorista: ${formatCurrency(store.vehicleCostPerKm)}

            **Dados Diários:**
            ${dataSummary}

            Com base nesses dados, forneça um relatório em português do Brasil com as seguintes seções (use markdown ## e **):

            1. ## Análise de Desempenho 📊
               - Comente sobre o resultado geral do período (lucro total, lucro/hora).
               - Identifique o dia de maior e menor lucro na semana/mês, e se possível, especule o motivo (ex: fim de semana, evento local).
               - Avalie a consistência dos ganhos ao longo do período.

            2. ## Foco Principal para o Próximo Período 🎯
               - **Gere UMA ÚNICA recomendação principal, a mais importante de todas.** Esta recomendação deve ser extremamente específica, acionável e destacada em negrito.
               - Por exemplo: "**Seu lucro nos Sábados foi o dobro da média. Considere adicionar 2 horas extras de trabalho neste dia.**"

            3. ## Outras Recomendações 💡
               - Forneça 1 ou 2 dicas secundárias que também podem ajudar o motorista a otimizar seus ganhos.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAiInsights(response.text);
        } catch (e) {
            console.error(e);
            setError('Ocorreu um erro ao conectar com a IA. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-6 rounded-lg shadow-xl space-y-6">
            <div className="flex justify-center bg-night-900/60 p-1 rounded-full">
                <button onClick={() => { setPeriodType('week'); setCurrentDate(new Date()); setAiInsights(''); setError('') }} className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${ periodType === 'week' ? 'bg-brand-blue text-white shadow' : 'text-gray-300 hover:bg-night-700/50' }`}>
                    Semanal
                </button>
                <button onClick={() => { setPeriodType('month'); setCurrentDate(new Date()); setAiInsights(''); setError('') }} className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${ periodType === 'month' ? 'bg-brand-blue text-white shadow' : 'text-gray-300 hover:bg-night-700/50' }`}>
                    Mensal
                </button>
            </div>

            <div className="flex items-center justify-between bg-night-900/50 p-2 rounded-lg">
                <button onClick={() => handleDateChange('prev')} className="p-2 rounded-full hover:bg-night-700/50 transition"><ChevronLeftIcon className="w-6 h-6" /></button>
                <p className="font-semibold text-center text-sm sm:text-base">{formatPeriodLabel(periodData.start, periodData.end, periodType)}</p>
                <button onClick={() => handleDateChange('next')} className="p-2 rounded-full hover:bg-night-700/50 transition"><ChevronRightIcon className="w-6 h-6" /></button>
            </div>
            
            {periodData.filteredEntries.length > 0 ? (
                <>
                    <div className="flex gap-2 justify-center flex-wrap">
                        <StatCard title="Lucro Líquido" value={formatCurrency(periodData.stats.totalProfit)} />
                        <StatCard title="Lucro / Hora" value={formatCurrency(periodData.stats.profitPerHour)} />
                        <StatCard title="Dias Registrados" value={periodData.stats.daysWorked.toString()} />
                    </div>

                    <div className="w-full h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={periodData.chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.3} />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${formatCurrency(v as number)}`} />
                                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} content={<CustomTooltip />} />
                                <Bar dataKey="Lucro">
                                    {periodData.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.Lucro >= 0 ? '#10B981' : '#F87171'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                        {aiInsights && !isLoading && (
                            <div className="bg-night-900/50 p-4 rounded-md border border-night-700">
                                <RenderInsightsComponent text={aiInsights} />
                            </div>
                        )}
                        {isLoading && (
                             <div className="flex justify-center items-center min-h-[100px] text-gray-400">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Analisando período...</span>
                            </div>
                        )}
                        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                        
                        <button onClick={handleGenerateInsights} disabled={isLoading || periodData.filteredEntries.length < 2} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-green to-emerald-600 text-white font-bold py-3 rounded-md hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                           <div className="w-6 h-6"><SparklesIcon /></div> {aiInsights ? 'Gerar Nova Análise' : 'Análise com IA'}
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-400 py-8">Nenhum registro encontrado para este período.</p>
            )}

        </div>
    );
};

export default PerformanceOptimizer;