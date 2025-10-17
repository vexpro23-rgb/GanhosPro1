import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import type { GanhosProStore } from '../../types.ts';

interface GeneralReportProps {
    store: GanhosProStore;
}

type Period = 'week' | 'month' | 'year';

// --- UI COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string; subvalue?: string }> = ({ title, value, subvalue }) => (
    <div className="bg-night-900/50 border border-night-700/70 p-4 rounded-lg text-center h-full flex flex-col justify-center">
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subvalue && <p className="text-xs text-gray-500">{subvalue}</p>}
    </div>
);

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (active && payload && payload.length) {
        return (
            <div className="bg-night-900/80 backdrop-blur-sm p-3 rounded-lg border border-night-600 shadow-lg text-sm">
                <p className="font-bold text-white mb-1">{label}</p>
                {payload.map((p, i) => (
                     <p key={i} className="font-semibold" style={{ color: p.color }}>
                        {`${p.name}: ${formatCurrency(p.value as number)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// --- HELPER FUNCTIONS ---

const getWeekKey = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-S${weekNo.toString().padStart(2, '0')}`;
}

const getMonthKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

const getYearKey = (date: Date): string => {
    return date.getFullYear().toString();
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- MAIN COMPONENT ---

const GeneralReport: React.FC<GeneralReportProps> = ({ store }) => {
    const [period, setPeriod] = useState<Period>('month');

    const periodData = useMemo(() => {
        const { entries, vehicleCostPerKm } = store;
        if (entries.length === 0) return { chartData: [], summaryStats: { totalProfit: 0, avgProfitPerDay: 0, daysWorked: 0, bestDay: { profit: 0, date: '' } } };

        const aggregator = new Map<string, { totalProfit: number; days: Set<string>; }>();
        const getGroupKey = (d: Date) => (period === 'week' ? getWeekKey(d) : period === 'month' ? getMonthKey(d) : getYearKey(d));

        let overallBestDay = { profit: -Infinity, date: '' };

        entries.forEach(entry => {
            const date = new Date(entry.date);
            if (isNaN(date.getTime())) return;

            const key = getGroupKey(date);
            const netProfit = entry.totalEarnings - (entry.kmDriven * vehicleCostPerKm) - entry.additionalCosts;

            if (netProfit > overallBestDay.profit) {
                overallBestDay = { profit: netProfit, date: entry.date };
            }

            const current = aggregator.get(key) || { totalProfit: 0, days: new Set() };
            current.totalProfit += netProfit;
            current.days.add(entry.date);
            aggregator.set(key, current);
        });

        const sortedKeys = Array.from(aggregator.keys()).sort();
        const chartData = sortedKeys.map(key => {
            const data = aggregator.get(key)!;
            let name = key;
            if (period === 'week') {
                const [year, week] = key.split('-S'); name = `Sem ${week}/${year.slice(-2)}`;
            } else if (period === 'month') {
                const [y, m] = key.split('-'); name = `${new Date(+y, +m - 1).toLocaleString('pt-BR', { month: 'short' })}/${y.slice(-2)}`;
            }
            return { name, Lucro: parseFloat(data.totalProfit.toFixed(2)) };
        });
        
        const totalProfitAllTime = Array.from(aggregator.values()).reduce((acc, curr) => acc + curr.totalProfit, 0);
        const totalDays = entries.length;
        
        return { 
            chartData, 
            summaryStats: {
                totalProfit: totalProfitAllTime,
                avgProfitPerDay: totalDays > 0 ? totalProfitAllTime / totalDays : 0,
                daysWorked: totalDays,
                bestDay: overallBestDay,
            }
        };
    }, [store.entries, store.vehicleCostPerKm, period]);

    const tabs: { id: Period, label: string }[] = [{ id: 'week', label: 'Semanal' }, { id: 'month', label: 'Mensal' }, { id: 'year', label: 'Anual' }];

    if (store.entries.length < 3) {
        return <p className="text-center text-gray-400 py-4">É necessário ter pelo menos 3 registros para gerar um relatório detalhado.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                 <h3 className="text-lg font-semibold text-white mb-3 text-center">Visão Geral do Período</h3>
                <div className="flex justify-center bg-night-900/60 p-1 rounded-full mb-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setPeriod(tab.id)} className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${ period === tab.id ? 'bg-brand-green text-white shadow' : 'text-gray-300 hover:bg-night-700/50' }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Lucro Total" value={formatCurrency(periodData.summaryStats.totalProfit)} />
                    <StatCard title="Média Lucro/Dia" value={formatCurrency(periodData.summaryStats.avgProfitPerDay)} />
                    <StatCard title="Dias Trabalhados" value={periodData.summaryStats.daysWorked.toString()} />
                    <StatCard title="Melhor Dia (Lucro)" value={formatCurrency(periodData.summaryStats.bestDay.profit)} subvalue={new Date(periodData.summaryStats.bestDay.date).toLocaleDateString('pt-BR')}/>
                </div>
            </div>

            {periodData.chartData.length > 0 && (
                 <div className="bg-night-900/50 border border-night-700/70 p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-white mb-4 text-center">Tendência de Lucro</h3>
                     <div className="w-full h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={periodData.chartData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                 <defs><linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.7}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.3} />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="Lucro" stroke="#10B981" fillOpacity={1} fill="url(#colorLucro)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default GeneralReport;