import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, CloudArrowUpIcon, DocumentChartBarIcon, ArrowDownTrayIcon, CalendarDaysIcon, ChartPieIcon, InformationCircleIcon, ChevronLeftIcon } from '../Icons.tsx';
import type { GanhosProStore } from '../../types.ts';
import GeneralReport from './GeneralReport.tsx';
import DayOfWeekAnalysis from './DayOfWeekAnalysis.tsx';
import PerformanceOptimizer from './PerformanceOptimizer.tsx';

interface PremiumViewProps {
    store: GanhosProStore;
}

type ActiveTool = 'ai-insights' | 'report' | 'data-tools' | 'day-of-week-analysis' | 'performance-analysis';
type DateRange = '30d' | '90d' | 'all';

// Component to render the AI-generated insights with basic markdown support
const RenderInsights: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="space-y-3 text-gray-300">
            {lines.map((line, index) => {
                if (line.startsWith('## ')) {
                    return <h4 key={index} className="text-lg font-semibold text-white pt-2">{line.substring(3)}</h4>;
                }
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                    <p key={index}>
                        {parts.map((part, i) =>
                            i % 2 === 1 ? <strong key={i} className="text-gray-100">{part}</strong> : part
                        )}
                    </p>
                );
            })}
        </div>
    );
};


const PremiumView: React.FC<PremiumViewProps> = ({ store }) => {
    const [selectedTool, setSelectedTool] = useState<ActiveTool | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [lastAnalysisDataSnapshot, setLastAnalysisDataSnapshot] = useState<string>('');
    const [aiDateRange, setAiDateRange] = useState<DateRange>('30d');


    const handleGenerateInsights = async () => {
        const dateRangeTextMap = { '30d': 'últimos 30 dias', '90d': 'últimos 90 dias', 'all': 'todo o período' };

        const getFilteredEntries = () => {
             if (aiDateRange === 'all') return store.entries;
             const days = aiDateRange === '30d' ? 30 : 90;
             const cutoffDate = new Date();
             cutoffDate.setDate(cutoffDate.getDate() - days);
             return store.entries.filter(e => new Date(e.date) >= cutoffDate);
        }
        
        const filteredEntries = getFilteredEntries();

        if (filteredEntries.length < 3) {
            setError(`É necessário ter pelo menos 3 registros no período selecionado (${dateRangeTextMap[aiDateRange]}) para gerar uma análise.`);
            return;
        }

        setIsLoading(true);
        setError('');
        setInsights('');

        const dataSummary = filteredEntries.slice(0, 45).map(e => { // limit to 45 to keep prompt reasonable
            const date = new Date(e.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
            const netProfit = e.totalEarnings - (e.kmDriven * store.vehicleCostPerKm) - e.additionalCosts;
            return `Data: ${date}, Lucro Líquido: R$${netProfit.toFixed(2)}, KM Rodados: ${e.kmDriven}, Horas: ${e.hoursWorked}`;
        }).join('\n');
        
        const currentSnapshot = JSON.stringify(filteredEntries) + aiDateRange;
        if (insights && currentSnapshot === lastAnalysisDataSnapshot) {
            if (!window.confirm("Seus dados para este período não mudaram desde a última análise. Deseja gerar uma nova análise mesmo assim?")) {
                setIsLoading(false);
                setInsights(insights);
                return;
            }
        }
        
        const prompt = `
            Você é um analista financeiro especialista para motoristas de aplicativo. Analise os seguintes dados de corridas de um motorista para o período de '${dateRangeTextMap[aiDateRange]}' e forneça insights valiosos.

            Dados:
            ${dataSummary}

            Custo por KM configurado pelo motorista: R$${store.vehicleCostPerKm.toFixed(2)}

            Sua análise deve ser em português do Brasil e dividida em seções usando markdown simples (## Título e **negrito**):
            1.  **## Resumo Geral (${dateRangeTextMap[aiDateRange]}) 📈**: Calcule e apresente o lucro líquido médio por dia, por hora e por KM para o período analisado.
            2.  **## Análise de Desempenho 📊**: Identifique os dias da semana mais e menos lucrativos (se houver dados suficientes no período). Comente sobre a consistência dos ganhos.
            3.  **## Sugestão Personalizada 💡**: Com base nos dados deste período, forneça uma dica acionável e personalizada para o motorista aumentar seus lucros. Seja criativo, por exemplo, sugira focar em horários específicos, otimizar rotas para reduzir custos, ou gerenciar custos adicionais.

            Seja conciso, direto e encorajador.
        `;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setInsights(response.text);
            setLastAnalysisDataSnapshot(currentSnapshot);
        } catch (e) {
            console.error(e);
            setError('Ocorreu um erro ao conectar com a IA. Verifique sua conexão ou tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = (format: 'csv' | 'json') => {
        if (format === 'csv' && store.entries.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        let content = '';
        let mimeType = '';
        let fileName = '';

        if (format === 'csv') {
            const headers = 'Data,Ganhos Brutos (R$),KM Rodados,Horas Trabalhadas,Custos Adicionais (R$),Custo Carro (R$),Lucro Liquido (R$),Lucro/KM (R$),Lucro/Hora (R$)\n';
            const rows = store.entries.map(e => {
                 const carCost = e.kmDriven * store.vehicleCostPerKm;
                 const netProfit = e.totalEarnings - carCost - e.additionalCosts;
                 const profitPerKm = e.kmDriven > 0 ? netProfit / e.kmDriven : 0;
                 const profitPerHour = e.hoursWorked > 0 ? netProfit / e.hoursWorked : 0;

                 return [
                    new Date(e.date).toLocaleDateString('pt-BR'),
                    e.totalEarnings.toFixed(2).replace('.',','),
                    e.kmDriven.toFixed(2).replace('.',','),
                    e.hoursWorked.toFixed(2).replace('.',','),
                    e.additionalCosts.toFixed(2).replace('.',','),
                    carCost.toFixed(2).replace('.',','),
                    netProfit.toFixed(2).replace('.',','),
                    profitPerKm.toFixed(2).replace('.',','),
                    profitPerHour.toFixed(2).replace('.',',')
                 ].join(',');
            }).join('\n');
            content = headers + rows;
            mimeType = 'text/csv;charset=utf-8;';
            fileName = 'ganhospro_historico.csv';
        } else { // JSON for backup
            const backupData = {
                vehicleCostPerKm: store.vehicleCostPerKm,
                entries: store.entries,
            };
            content = JSON.stringify(backupData, null, 2);
            mimeType = 'application/json;charset=utf-8;';
            fileName = 'ganhospro_backup.json';
        }

        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleImportJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target?.result as string);
                        
                        if (typeof data.vehicleCostPerKm !== 'number' || !Array.isArray(data.entries)) {
                            throw new Error('Formato de backup inválido.');
                        }
                        
                        if (window.confirm(`Isso substituirá TODOS os seus dados atuais (registros e custo por KM). Deseja continuar?`)) {
                             store.replaceAllEntries(data.entries);
                             store.setVehicleCostPerKm(data.vehicleCostPerKm);
                             alert('Backup restaurado com sucesso!');
                        }
                    } catch (err) {
                        alert('Erro ao ler o arquivo. O arquivo de backup pode estar corrompido ou em formato incorreto.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };
    
    const tools: { id: ActiveTool; title: string; description: string; icon: React.ReactNode; }[] = [
        { 
            id: 'performance-analysis', 
            title: 'Análise de Performance',
            description: 'Compare períodos e receba insights de IA para otimizar seus ganhos.', 
            icon: <DocumentChartBarIcon />
        },
        { 
            id: 'report', 
            title: 'Relatório Geral de Ganhos', 
            description: 'Visualize a tendência dos seus lucros ao longo do tempo.', 
            icon: <ChartPieIcon /> 
        },
        { 
            id: 'day-of-week-analysis', 
            title: 'Análise por Dia da Semana', 
            description: 'Descubra seus dias e horários mais lucrativos e eficientes.', 
            icon: <CalendarDaysIcon /> 
        },
        { 
            id: 'ai-insights', 
            title: 'Insights Rápidos com IA', 
            description: 'Receba uma análise pontual sobre um período específico.', 
            icon: <SparklesIcon /> 
        },
        { 
            id: 'data-tools', 
            title: 'Backup e Exportação', 
            description: 'Faça backup, restaure ou exporte seu histórico completo.', 
            icon: <ArrowDownTrayIcon /> 
        },
    ];

    const dateRangeTabs: { id: DateRange, label: string }[] = [
        { id: '30d', label: 'Últimos 30 dias' },
        { id: '90d', label: 'Últimos 90 dias' },
        { id: 'all', label: 'Todo o Período' }
    ];

    const renderSelectedTool = () => {
        switch (selectedTool) {
            case 'performance-analysis':
                return <PerformanceOptimizer store={store} RenderInsightsComponent={RenderInsights} />;
            case 'ai-insights':
                return (
                    <div className="space-y-4">
                        <div className="relative flex justify-center items-center group">
                            <div className="ml-2 text-gray-400 cursor-help">
                                <InformationCircleIcon />
                            </div>
                            <div className="absolute bottom-full mb-2 w-72 bg-night-900 border border-night-600 text-gray-300 text-xs rounded-lg p-3 shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-10 text-left">
                                <p className="font-bold text-white mb-1">Como funciona?</p>
                                Esta IA analisa seu desempenho no período selecionado (lucro/h, lucro/km) para gerar um resumo e uma dica personalizada. Quanto mais registros no período, mais precisa a análise.
                            </div>
                        </div>
                         <div className="flex justify-center bg-night-900/60 p-1 rounded-full my-4">
                            {dateRangeTabs.map(tab => (
                                <button key={tab.id} onClick={() => setAiDateRange(tab.id)} className={`w-full py-2 px-3 text-sm font-semibold rounded-full transition-colors ${ aiDateRange === tab.id ? 'bg-brand-blue text-white shadow' : 'text-gray-300 hover:bg-night-700/50' }`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {insights && !isLoading && (
                            <div className="mt-4 bg-night-900/50 p-4 rounded-md min-h-[100px] space-y-3 border border-night-700">
                                <RenderInsights text={insights} />
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex justify-center items-center min-h-[100px] text-gray-400">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Analisando seus dados...</span>
                            </div>
                        )}
                        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                        {!isLoading && (
                            <button onClick={handleGenerateInsights} className="w-full bg-gradient-to-r from-brand-green to-emerald-600 text-white font-bold py-3 rounded-md hover:opacity-90 transition-all transform hover:scale-105">
                                {insights ? 'Gerar Nova Análise' : 'Gerar Análise'}
                            </button>
                        )}
                    </div>
                );
            case 'report':
                 return <GeneralReport store={store} />;
            case 'day-of-week-analysis':
                return <DayOfWeekAnalysis store={store} />;
            case 'data-tools':
                return (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                           <div className="bg-night-900/40 rounded-lg border border-night-700/60 p-6 flex flex-col items-center text-center">
                                <div className="flex-shrink-0 w-12 h-12 text-brand-blue mb-3"><CloudArrowUpIcon/></div>
                                <h4 className="font-bold text-white text-lg">Backup e Restauração</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-4 flex-grow">Salve ou restaure todos os seus dados usando um arquivo local.</p>
                                <div className="flex gap-2 w-full">
                                   <button onClick={() => handleExport('json')} className="w-full bg-brand-blue/80 text-white font-semibold py-2 rounded-md hover:bg-brand-blue transition text-sm">Backup</button>
                                   <button onClick={handleImportJSON} className="w-full bg-night-700 text-white font-semibold py-2 rounded-md hover:bg-night-600 transition text-sm">Restaurar</button>
                                </div>
                           </div>
                           <div className="bg-night-900/40 rounded-lg border border-night-700/60 p-6 flex flex-col items-center text-center">
                                <div className="flex-shrink-0 w-12 h-12 text-brand-green mb-3"><ArrowDownTrayIcon/></div>
                                <h4 className="font-bold text-white text-lg">Exportar para Planilha</h4>
                                <p className="text-sm text-gray-400 mt-1 mb-4 flex-grow">Exporte seu histórico para um arquivo CSV para análise avançada.</p>
                                 <button onClick={() => handleExport('csv')} className="w-full bg-brand-green/80 text-white font-semibold py-2 rounded-md hover:bg-brand-green transition text-sm">Exportar CSV</button>
                           </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const getToolById = (id: ActiveTool) => tools.find(t => t.id === id);

    // Main Menu View
    if (!selectedTool) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto text-yellow-400">
                        <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse"></div>
                        <SparklesIcon />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mt-2">Desbloqueie o Potencial Máximo</h2>
                    <p className="text-gray-300 mt-2 max-w-md mx-auto">Selecione uma ferramenta para levar seu controle financeiro para o próximo nível.</p>
                </div>
                <div className="space-y-4 pt-4">
                    {tools.map(tool => (
                        <button 
                            key={tool.id} 
                            onClick={() => setSelectedTool(tool.id)} 
                            className="w-full bg-night-800/50 border border-night-700 p-4 rounded-lg flex items-center gap-4 text-left hover:bg-night-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        >
                            <div className="flex-shrink-0 w-10 h-10 text-brand-green bg-night-900/50 p-2 rounded-lg">{tool.icon}</div>
                            <div>
                                <h3 className="font-bold text-white text-base">{tool.title}</h3>
                                <p className="text-gray-400 text-sm">{tool.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="text-center mt-8">
                    <button className="w-full max-w-sm bg-gradient-to-r from-yellow-400 to-amber-500 text-night-900 font-bold py-3 rounded-md text-base hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20">
                        Apoie o Desenvolvedor
                    </button>
                </div>
            </div>
        );
    }
    
    const currentTool = getToolById(selectedTool);

    // Individual Tool View
    return (
        <div className="animate-fade-in-up">
            <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-4 sm:p-6 rounded-lg shadow-xl">
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSelectedTool(null)} 
                        className="flex-shrink-0 p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-night-700/50 -ml-2"
                        aria-label="Voltar"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex-shrink-0 w-8 h-8 text-brand-green">{currentTool?.icon}</div>
                        <div className="overflow-hidden">
                            <h2 className="text-xl font-bold text-white truncate">{currentTool?.title}</h2>
                            <p className="text-xs text-gray-400 -mt-1 truncate">{currentTool?.description}</p>
                        </div>
                    </div>
                </div>
                
                <hr className="border-night-700 my-4" />

                {renderSelectedTool()}
            </div>
        </div>
    );
};

export default PremiumView;