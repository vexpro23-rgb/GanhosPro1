import React, { useState, useMemo } from 'react';
import { CheckCircleIcon, LockClosedIcon, SparklesIcon, CloudArrowUpIcon, DocumentChartBarIcon, ArrowDownTrayIcon } from '../Icons';
import type { GanhosProStore } from '../../types';

interface PremiumViewProps {
    store: GanhosProStore;
}

// Data for the dynamic preview
const sampleInsights = [
    {
        summary: "Seu lucro líquido médio é de **R$ 185,40/dia** e **R$ 23,17/hora**.",
        tip: "**Melhor Dia:** A sexta-feira se mostrou o dia mais lucrativo para você, com uma média de **R$ 29,50/hora**."
    },
    {
        summary: "Analisando seus dados, sua média de lucro é **R$ 205,10/dia** e **R$ 25,63/hora**.",
        tip: "**Análise de Custos:** Seus custos com o carro representam **35%** dos seus ganhos. Tente otimizar suas rotas."
    },
    {
        summary: "Com base nas últimas semanas, seu lucro médio foi de **R$ 170,80/dia** e **R$ 21,35/hora**.",
        tip: "**Sugestão:** Seus ganhos por hora são maiores no período da manhã. Considere começar mais cedo."
    }
];

// Simple component to parse markdown-like bold text
const ParsedMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
        <>
            {parts.map((part, index) =>
                index % 2 === 1 ? <strong key={index} className="text-gray-200">{part}</strong> : part
            )}
        </>
    );
};


const PremiumView: React.FC<PremiumViewProps> = ({ store }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<string>('');
    const [error, setError] = useState<string>('');

     // Select a random insight on component mount to make the preview dynamic
    const randomInsight = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * sampleInsights.length);
        return sampleInsights[randomIndex];
    }, []);
    
    // This function is ready but won't be called due to the UI overlay
    const handleGenerateInsights = async () => {
        // Functionality locked for premium
    };
    
    const otherPremiumFeatures = [
        { icon: <CloudArrowUpIcon />, title: "Backup Seguro na Nuvem", description: "Nunca perca seus dados. Seus registros são salvos e sincronizados com segurança na nuvem, permitindo acesso de qualquer dispositivo." },
        { icon: <DocumentChartBarIcon />, title: "Relatórios Detalhados", description: "Entenda seus ganhos como nunca antes. Gere relatórios detalhados com filtros avançados e gráficos interativos para identificar seus dias e horários mais lucrativos." },
        { icon: <ArrowDownTrayIcon />, title: "Exportação de Dados", description: "Leve seus dados com você. Exporte seu histórico completo para planilhas (CSV) ou documentos (PDF) para contabilidade ou análises avançadas." },
        { icon: <SparklesIcon />, title: "Insights com IA", description: "Receba análises automáticas e sugestões personalizadas para otimizar suas corridas e aumentar seu lucro líquido real." },
    ];

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

            {/* AI Insights Preview */}
            <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-6 rounded-lg shadow-xl space-y-4">
                <h3 className="text-xl font-semibold text-white text-center flex items-center justify-center gap-2">
                    <SparklesIcon /> Insights com IA (Exemplo Premium)
                </h3>
                <p className="text-center text-sm text-gray-400 mb-4">Descubra seus melhores dias e horários para maximizar o lucro.</p>
                
                <div className="mt-4 bg-night-900/50 p-4 rounded-md min-h-[100px] space-y-3 border border-night-700">
                    <div>
                        <p className="text-gray-400 text-sm font-semibold">## Resumo Geral 📈</p>
                        <p className="text-gray-300">
                           <ParsedMarkdown text={randomInsight.summary} />
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-semibold">## Sugestão Personalizada 💡</p>
                        <p className="text-gray-300">
                           <ParsedMarkdown text={randomInsight.tip} />
                        </p>
                    </div>
                </div>

                <button disabled className="w-full flex items-center justify-center gap-2 bg-night-700 text-gray-400 font-bold py-3 rounded-md cursor-not-allowed">
                    <LockClosedIcon className="w-5 h-5" />
                    Gerar Análise (Premium)
                </button>
            </div>
            
            <div className="bg-night-800/50 backdrop-blur-lg border border-night-700 p-6 rounded-lg shadow-xl space-y-6">
                <h3 className="text-xl font-semibold text-white text-center">Todos os Benefícios Premium</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {otherPremiumFeatures.map(feature => (
                        <div key={feature.title} className="flex items-start space-x-4 p-4 bg-night-900/40 rounded-lg border border-night-700/60 h-full">
                            <div className="flex-shrink-0 w-8 h-8 text-yellow-400 mt-1">{feature.icon}</div>
                            <div>
                                <h4 className="font-bold text-white">{feature.title}</h4>
                                <p className="text-sm text-gray-400">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 <button className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-night-900 font-bold py-3 rounded-md text-base hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/20">
                    Assinar o Premium Agora
                </button>
            </div>
        </div>
    );
};

export default PremiumView;