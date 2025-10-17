import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import type { GanhosProStore } from '../../types.ts';

interface GeneralReportProps {
    store: GanhosProStore;
}

type Period = 'week' | 'month' | 'year';

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-night-900/50 border border-night-700/70 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">{title}</p>
        <p className="text-lg font-bold text-white">{value}</p>
    </div>
);

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (active && payload && payload.length) {
        return (
            <div className="bg-night-900/80 backdrop-blur-sm p-3 rounded-lg border border-night-600 shadow-lg text-sm">
                <p className="font-bold text-white mb-1">{label}</p>
                <p className="text-base font-semibold text-green-400">
                    {`Lucro: ${formatCurrency(payload[0].value as number)}`}
                </p>
            </div>
        );
    }
    return null;
};

// --- HELPERS ---
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
// --- END HELPERS ---

const GeneralReport: React.FC<GeneralReportProps> = ({ store }) => {
    const [period, setPeriod] = useState<Period>('week');

    const { chartData, summaryStats } = useMemo(() => {
        const { entries, vehicleCostPerKm } = store;
        if (entries.length === 0) return { chartData: [], summaryStats: { total: 0, average: 0, periods: 0 } };

        const aggregator = new Map<string, { totalProfit: number; count: number }>();

        const getGroupKey = (date: Date) => {
            switch (period) {
                case 'week': return getWeekKey(date);
                case 'month': return getMonthKey(date);
                case 'year': return getYearKey(date);
            }
        };

        entries.forEach(entry => {
            const date = new Date(entry.date);
            // Ensure date is valid before processing
            if (isNaN(date.getTime())) return;

            const key = getGroupKey(date);
            const netProfit = entry.totalEarnings - (entry.kmDriven * vehicleCostPerKm) - entry.additionalCosts;

            const current = aggregator.get(key) || { totalProfit: 0, count: 0 };
            current.totalProfit += netProfit;
            current.count += 1;
            aggregator.set(key, current);
        });

        const sortedKeys = Array.from(aggregator.keys()).sort();
        const processedChartData = sortedKeys.map(key => {
            const data = aggregator.get(key)!;
            let name = key;
            if (period === 'week') {
                const [year, week] = key.split('-S');
                name = `Sem ${week}/${year.slice(-2)}`;
            }
            if (period === 'month') {
                const [year, month] = key.split('-');
                name = `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' })}/${year.slice(-2)}`;
            }
            return {
                name,
                Lucro: parseFloat(data.totalProfit.toFixed(2)),
            };
        });
        
        const totalProfitAllTime = Array.from(aggregator.values()).reduce((acc, curr) => acc + curr.totalProfit, 0);
        const totalDays = Array.from(aggregator.values()).reduce((acc, curr) => acc + curr.count, 0);
        
        const processedSummaryStats = {
            total: totalProfitAllTime,
            average: totalDays > 0 ? totalProfitAllTime / totalDays : 0,
            periods: aggregator.size,
        };

        return { chartData: processedChartData, summaryStats: processedSummaryStats };
    }, [store.entries, store.vehicleCostPerKm, period]);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const tabs: { id: Period, label: string }[] = [
        { id: 'week', label: 'Semanal' },
        { id: 'month', label: 'Mensal' },
        { id: 'year', label: 'Anual' },
    ];

    if (store.entries.length === 0) {
        return <p className="text-center text-gray-400 py-4">Não há dados suficientes no histórico para gerar um relatório.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-center bg-night-900/60 p-1 rounded-full">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setPeriod(tab.id)}
                        className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${
                            period === tab.id ? 'bg-brand-green text-white' : 'text-gray-300 hover:bg-night-700/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StatCard title="Lucro Total" value={formatCurrency(summaryStats.total)} />
                <StatCard title="Média / Dia" value={formatCurrency(summaryStats.average)} />
                <StatCard title="Nº de Períodos" value={summaryStats.periods.toString()} />
            </div>

            {chartData.length > 0 ? (
                 <div className="w-full h-52 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                             <defs>
                                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.7}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.3} />
                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="Lucro" stroke="#10B981" fillOpacity={1} fill="url(#colorLucro)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="text-center text-gray-400 py-8">Não há dados para o período selecionado.</p>
            )}
        </div>
    );
};

export default GeneralReport;
