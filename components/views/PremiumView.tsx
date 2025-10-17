import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, CloudArrowUpIcon, DocumentChartBarIcon, ArrowDownTrayIcon } from '../Icons.tsx';
import type { GanhosProStore, Entry } from '../../types.ts';
import GeneralReport from './GeneralReport.tsx';

interface PremiumViewProps {
    store: GanhosProStore;
}

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
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleGenerateInsights = async () => {
        if (store.entries.length < 3) {
            setError("É necessário ter pelo menos 3 registros no histórico para gerar uma análise.");
            return;
        }

        setIsLoading(true);
        setError('');
        setInsights('');

        const dataSummary = store.entries.slice(0, 30).map(e => {
            const date = new Date(e.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
            const netProfit = e.totalEarnings - (e.kmDriven * store.vehicleCostPerKm) - e.additionalCosts;
            return `Data: ${date}, Lucro Líquido: R$${netProfit.toFixed(2)}, KM Rodados: ${e.kmDriven}, Horas: ${e.hoursWorked}`;
        }).join('\n');
        
        const prompt = `
            Você é um analista financeiro especialista para motoristas de aplicativo. Analise os seguintes dados de corridas de um motorista e forneça insights valiosos.

            Dados (até 30 registros mais recentes):
            ${dataSummary}

            Custo por KM configurado pelo motorista: R$${store.vehicleCostPerKm.toFixed(2)}

            Sua análise deve ser em português do Brasil e dividida em seções usando markdown simples (## Título e **negrito**):
            1.  **## Resumo Geral 📈**: Calcule e apresente o lucro líquido médio por dia, por hora e por KM para o período analisado.
            2.  **## Análise de Desempenho 📊**: Identifique os dias da semana mais e menos lucrativos (se houver dados suficientes). Comente sobre a consistência dos ganhos.
            3.  **## Sugestão Personalizada 💡**: Com base nos dados, forneça uma dica acionável e personalizada para o motorista aumentar seus lucros. Seja criativo, por exemplo, sugira focar em horários específicos, otimizar rotas para reduzir custos, ou gerenciar custos adicionais.

            Seja conciso, direto e encorajador.
        `;
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setInsights(response.text);
        } catch (e) {
            console.error(e);
            setError('Ocorreu um erro ao conectar com a IA. Verifique sua conexão ou tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = (format: 'csv' | 'json') => {
        if (store.entries.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        let content = '';
        let mimeType = '';
        let fileName = '';

        if (format === 'csv') {
            const headers = 'Data,Ganhos Totais (R$),KM Rodados,Horas Trabalhadas,Custos Adicionais (R$),Custo Carro (R$),Lucro Liquido (R$)\n';
            const rows = store.entries.map(e => {
                 const carCost = e.kmDriven * store.vehicleCostPerKm;
                 const netProfit = e.totalEarnings - carCost - e.additionalCosts;
                 return [
                    new Date(e.date).toLocaleDateString('pt-BR'),
                    e.totalEarnings.toFixed(2).replace('.',','),
                    e.kmDriven.toFixed(2).replace('.',','),
                    e.hoursWorked.toFixed(2).replace('.',','),
                    e.additionalCosts.toFixed(2).replace('.',','),
                    carCost.toFixed(2).replace('.',','),
                    netProfit.toFixed(2).replace('.',',')
                 ].join(',');
            }).join('\n');
            content = headers + rows;
            mimeType = 'text/csv;charset=utf-8;';
            fileName = 'ganhospro_historico.csv';
        } else { // JSON for backup
            content = JSON.stringify(store.entries, null, 2);
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
                        const newEntries = JSON.parse(e.target?.result as string) as Entry[];
                        if (window.confirm(`Isso substituirá todos os dados atuais. Deseja continuar?`)) {
                             store.replaceAllEntries(newEntries);
                             alert('Backup restaurado com sucesso!');
                        }
                    } catch (err) {
                        alert('Erro ao ler o arquivo. O arquivo de backup pode estar corrompido.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                 <div className="relative w-16 h-16 mx-auto text-yellow-400">
                    <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse"></div>
                    <SparklesIcon />
                </div>
                <h2 className="text-3xl font-extrabold text-white mt-2">Desbloqueie o Potencial Máximo</h2>
                <p className="text-gray-300 mt-2">Leve seu controle financeiro para o próximo nível com GanhosPro Premium.</p>
            </div>

            {/* AI Insights */}
            <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-6 rounded-lg shadow-xl space-y-4">
                <h3 className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
                    <SparklesIcon /> Insights com IA
                </h3>
                
                {insights && !isLoading && (
                     <div className="mt-4 bg-night-900/50 p-4 rounded-md min-h-[100px] space-y-3 border border-night-700 animate-fade-in-up">
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

            {/* General Report */}
            <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-6 rounded-lg shadow-xl space-y-4">
                 <h3 className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
                    <DocumentChartBarIcon /> Relatório de Desempenho
                </h3>
                <GeneralReport store={store} />
            </div>
            
             <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-6 rounded-lg shadow-xl space-y-6">
                <h3 className="text-xl font-semibold text-white text-center">Ferramentas de Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                   <div className="bg-night-900/40 rounded-lg border border-night-700/60 p-4 flex flex-col items-center text-center">
                        <div className="flex-shrink-0 w-10 h-10 text-brand-blue mb-2"><CloudArrowUpIcon/></div>
                        <h4 className="font-bold text-white">Backup e Restauração</h4>
                        <p className="text-sm text-gray-400 mt-1 mb-3 flex-grow">Salve ou restaure todos os seus dados usando um arquivo local.</p>
                        <div className="flex gap-2 w-full">
                           <button onClick={() => handleExport('json')} className="w-full bg-brand-blue/80 text-white font-semibold py-2 rounded-md hover:bg-brand-blue transition text-sm">Backup</button>
                           <button onClick={handleImportJSON} className="w-full bg-night-700 text-white font-semibold py-2 rounded-md hover:bg-night-600 transition text-sm">Restaurar</button>
                        </div>
                   </div>
                   <div className="bg-night-900/40 rounded-lg border border-night-700/60 p-4 flex flex-col items-center text-center">
                        <div className="flex-shrink-0 w-10 h-10 text-brand-green mb-2"><ArrowDownTrayIcon/></div>
                        <h4 className="font-bold text-white">Exportar para Planilha</h4>
                        <p className="text-sm text-gray-400 mt-1 mb-3 flex-grow">Exporte seu histórico para um arquivo CSV para análise avançada.</p>
                         <button onClick={() => handleExport('csv')} className="w-full bg-brand-green/80 text-white font-semibold py-2 rounded-md hover:bg-brand-green transition text-sm">Exportar CSV</button>
                   </div>
                </div>
            </div>

            <div className="text-center">
                 <button className="w-full max-w-sm mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-night-900 font-bold py-3 rounded-md text-base hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20">
                    Apoie o Desenvolvedor
                </button>
            </div>
        </div>
    );
};

export default PremiumView;