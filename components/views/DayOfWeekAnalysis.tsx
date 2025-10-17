import React, { useState, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import type { GanhosProStore } from '../../types.ts';
import { ArrowDownTrayIcon } from '../Icons.tsx';


interface DayOfWeekAnalysisProps {
    store: GanhosProStore;
}

type DayOfWeekMetric = 'profitPerHour' | 'earningsPerHour' | 'avgKm';
type DateRange = '30d' | '90d' | 'all';

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (active && payload && payload.length) {
        return (
            <div className="bg-night-900/80 backdrop-blur-sm p-3 rounded-lg border border-night-600 shadow-lg text-sm">
                <p className="font-bold text-white mb-1">{label}</p>
                {payload.map((p, i) => (
                     <p key={i} className="font-semibold" style={{ color: p.color }}>
                        {`${p.name}: ${p.dataKey?.toString().includes('Km') ? `${(p.value as number).toFixed(1)} km` : formatCurrency(p.value as number)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const DayOfWeekAnalysis: React.FC<DayOfWeekAnalysisProps> = ({ store }) => {
    const [metric, setMetric] = useState<DayOfWeekMetric>('profitPerHour');
    const [range, setRange] = useState<DateRange>('all');
    const [isExporting, setIsExporting] = useState(false);
    const exportContentRef = useRef<HTMLDivElement>(null);

    const dateRangeTabs: { id: DateRange, label: string }[] = [
        { id: '30d', label: '30 Dias' },
        { id: '90d', label: '90 Dias' },
        { id: 'all', label: 'Todo o Período' }
    ];

    const metricOptions: {id: DayOfWeekMetric, label: string}[] = [
        { id: 'profitPerHour', label: 'Lucro / h' },
        { id: 'earningsPerHour', label: 'Ganhos / h' },
        { id: 'avgKm', label: 'Média KM' },
    ];

    const handleExportPDF = async () => {
        if (!exportContentRef.current || !window.jspdf || !window.html2canvas) {
            alert('Não foi possível gerar o PDF. A biblioteca de exportação pode não ter sido carregada.');
            return;
        }
        setIsExporting(true);
        try {
            const { jsPDF } = window.jspdf;
            const canvas = await window.html2canvas(exportContentRef.current, {
                useCORS: true,
                backgroundColor: '#111827'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;

            let imgWidth = pdfWidth - 20;
            let imgHeight = imgWidth / ratio;

            if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20;
                imgWidth = imgHeight * ratio;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = 10;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`analise_dia_semana_ganhospro.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            setIsExporting(false);
        }
    };


    const filteredEntries = useMemo(() => {
        if (range === 'all') return store.entries;
        const days = range === '30d' ? 30 : 90;
        const cutoffDate = new Date();
        cutoffDate.setHours(0, 0, 0, 0);
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return store.entries.filter(e => new Date(e.date) >= cutoffDate);
    }, [store.entries, range]);

    const chartData = useMemo(() => {
        const days = Array(7).fill(null).map(() => ({ totalProfit: 0, totalEarnings: 0, totalHours: 0, totalKm: 0, count: 0 }));
        
        filteredEntries.forEach(entry => {
            const date = new Date(entry.date);
            // Must have worked hours to be considered for per-hour metrics
            if (isNaN(date.getTime()) || entry.hoursWorked <= 0) return;
            
            const dayIndex = date.getDay(); // 0 = Dom, 1 = Seg, ...
            const netProfit = entry.totalEarnings - (entry.kmDriven * store.vehicleCostPerKm) - entry.additionalCosts;

            days[dayIndex].totalProfit += netProfit;
            days[dayIndex].totalEarnings += entry.totalEarnings;
            days[dayIndex].totalHours += entry.hoursWorked;
            days[dayIndex].totalKm += entry.kmDriven;
            days[dayIndex].count++;
        });

        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return days.map((day, index) => ({
            name: dayNames[index],
            profitPerHour: day.count > 0 ? day.totalProfit / day.totalHours : 0,
            earningsPerHour: day.count > 0 ? day.totalEarnings / day.totalHours : 0,
            avgKm: day.count > 0 ? day.totalKm / day.count : 0,
        }));
    }, [filteredEntries, store.vehicleCostPerKm]);

    if (store.entries.length < 3) {
        return <p className="text-center text-gray-400 py-4">É necessário ter pelo menos 3 registros para gerar esta análise.</p>;
    }

    if (filteredEntries.length === 0) {
        return <p className="text-center text-gray-400 py-4">Nenhum registro encontrado para o período selecionado.</p>;
    }

    const chartConfig = {
        profitPerHour: { dataKey: 'profitPerHour', color: '#10B981', name: 'Lucro/Hora' },
        earningsPerHour: { dataKey: 'earningsPerHour', color: '#3B82F6', name: 'Ganhos/Hora' },
        avgKm: { dataKey: 'avgKm', color: '#F59E0B', name: 'Média KM' },
    };
    const currentMetricConfig = chartConfig[metric];

    return (
        <div className="space-y-6">
            <div ref={exportContentRef} className="bg-night-800 rounded-lg p-4">
                 <div className="p-2">
                     <h3 className="text-xl font-bold text-white text-center">Análise por Dia da Semana</h3>
                     <p className="text-sm text-gray-400 text-center mb-1">{`Período: ${dateRangeTabs.find(t => t.id === range)?.label}`}</p>
                     <p className="text-sm text-gray-400 text-center mb-4">{`Métrica: ${metricOptions.find(o => o.id === metric)?.label}`}</p>
                    <div className="w-full h-64 pt-2">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.2} />
                                <XAxis type="number" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => metric === 'avgKm' ? `${v.toFixed(0)}` : `R$${v.toFixed(0)}`} />
                                <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} content={<CustomTooltip />} />
                                <Bar dataKey={currentMetricConfig.dataKey} name={currentMetricConfig.name} fill={currentMetricConfig.color} background={{ fill: '#ffffff08' }} radius={[4, 4, 4, 4]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

             <div>
                <p className="text-center text-sm text-gray-400 mb-2">Analisar período:</p>
                <div className="flex justify-center bg-night-900/60 p-1 rounded-full">
                     {dateRangeTabs.map(tab => (
                        <button key={tab.id} onClick={() => setRange(tab.id)} className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${ range === tab.id ? 'bg-night-600 text-white shadow' : 'text-gray-300 hover:bg-night-700/50' }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="text-center text-sm text-gray-400 mb-2">Visualizar por:</p>
                <div className="flex justify-center bg-night-800/60 p-1 rounded-full">
                     {metricOptions.map(opt => (
                        <button key={opt.id} onClick={() => setMetric(opt.id)} className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${ metric === opt.id ? 'bg-brand-blue text-white shadow' : 'text-gray-300 hover:bg-night-700/50' }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-blue to-blue-500 text-white font-bold py-3 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-wait"
            >
                <div className="w-6 h-6"><ArrowDownTrayIcon /></div>
                {isExporting ? 'Exportando PDF...' : 'Exportar Análise em PDF'}
            </button>

        </div>
    );
};

export default DayOfWeekAnalysis;