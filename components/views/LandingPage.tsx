import React, { useState, useEffect } from 'react';
import { CalculatorIcon, HistoryIcon, SparklesIcon, ShareIcon, DotsVerticalIcon, ChevronDownIcon } from '../Icons';

interface LandingPageProps {
    onLaunchApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        });

        window.addEventListener('appinstalled', () => {
          setShowInstallButton(false);
          setDeferredPrompt(null);
          console.log('GanhosPro foi instalado com sucesso!');
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert('Para instalar o aplicativo, use a opção "Adicionar à Tela de Início" no menu do seu navegador.');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallButton(false);
    };
    
    const features = [
        { icon: <CalculatorIcon />, title: "Cálculo Preciso", description: "Saiba exatamente seu lucro líquido por KM e por hora, descontando os custos do veículo." },
        { icon: <HistoryIcon />, title: "Histórico Inteligente", description: "Acompanhe seus ganhos ao longo do tempo com gráficos e um histórico detalhado." },
        { icon: <SparklesIcon />, title: "Insights Premium", description: "Use IA para descobrir seus melhores dias e horários e otimizar suas corridas." }
    ];

    const faqs = [
        { q: 'O GanhosPro é gratuito?', a: 'Sim! As funcionalidades essenciais de cálculo e histórico são 100% gratuitas. Oferecemos uma versão Premium opcional com recursos avançados, como insights com IA e backup na nuvem.' },
        { q: 'Preciso criar uma conta?', a: 'Não é necessário. O aplicativo funciona imediatamente, salvando todos os seus dados de forma segura diretamente no seu dispositivo, garantindo sua privacidade.' },
        { q: 'O aplicativo funciona offline?', a: 'Sim! Uma vez instalado na sua tela inicial, o GanhosPro funciona perfeitamente sem conexão com a internet. Você pode calcular e consultar seu histórico em qualquer lugar.' },
        { q: 'Meus dados estão seguros?', a: 'Seus dados são armazenados apenas no seu aparelho (local storage do navegador). Nenhuma informação de corrida é enviada para servidores externos na versão gratuita, garantindo total controle e privacidade.' }
    ];

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="bg-gradient-to-b from-night-900 to-black text-gray-200 min-h-screen font-sans">
            <header className="p-4 z-10">
                <h1 className="text-xl font-extrabold text-center text-gray-100">
                    Ganhos<span className="text-brand-green">Pro</span>
                </h1>
            </header>

            <main className="p-4 md:p-8 overflow-hidden">
                <section className="text-center pt-10 pb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        Seu Lucro Real,
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-green to-emerald-400">Na Palma da Mão.</span>
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-gray-400 md:text-lg opacity-0 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
                        A ferramenta definitiva para motoristas de aplicativo que desejam entender e maximizar seus ganhos de verdade.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        {showInstallButton && (
                             <button onClick={handleInstallClick} className="w-full sm:w-auto bg-gradient-to-r from-brand-green to-emerald-600 text-white font-bold py-3 px-8 rounded-full hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20 animate-bounce-in">
                                Adicionar à Tela Inicial
                            </button>
                        )}
                        <button onClick={onLaunchApp} className="w-full sm:w-auto bg-night-800/80 text-gray-200 font-semibold py-3 px-8 rounded-full hover:bg-night-700 transition-colors border border-night-700">
                            Acessar a Versão Web
                        </button>
                    </div>
                </section>

                 <section className="relative flex justify-center items-center px-4 -mb-20 opacity-0 animate-fade-in-up" style={{ animationDelay: '550ms' }}>
                    <div className="w-full max-w-sm h-auto bg-gradient-to-b from-night-800 to-night-900 p-3 rounded-[40px] shadow-2xl border border-night-700/50">
                        <div className="bg-black w-full h-[550px] rounded-[30px] p-6 flex flex-col justify-center items-center space-y-6">
                            <h2 className="text-xl font-bold text-white text-center">Seu Resultado</h2>
                             <div className="bg-brand-green p-4 rounded-lg shadow-md w-full text-center">
                                <p className="text-sm text-white">Lucro Líquido Real</p>
                                <p className="text-3xl font-bold text-white">R$ 215,75</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-night-800/50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-400">Lucro por KM</p>
                                    <p className="text-lg font-bold text-white">R$ 1,02/km</p>
                                </div>
                                <div className="bg-night-800/50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-400">Lucro por Hora</p>
                                    <p className="text-lg font-bold text-white">R$ 26,96/h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-night-900/50 backdrop-blur-lg rounded-2xl py-20 px-6 mt-16">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {features.map((feature, index) => (
                            <div key={feature.title} className="flex flex-col items-center opacity-0 animate-fade-in-up" style={{ animationDelay: `${700 + index * 150}ms` }}>
                                <div className="w-12 h-12 text-brand-green bg-brand-green/10 p-3 rounded-xl border border-brand-green/30">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mt-4">{feature.title}</h3>
                                <p className="text-gray-400 mt-2">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
                
                <section className="py-16 text-center">
                     <h2 className="text-3xl font-extrabold text-white">Instale e Use como um App</h2>
                     <p className="mt-2 max-w-2xl mx-auto text-gray-400">
                        Tenha acesso rápido ao GanhosPro direto da sua tela inicial.
                     </p>
                     <div className="mt-8 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-night-800/50 border border-night-700 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-white">Para iPhone (iOS)</h3>
                            <div className="mt-4 flex items-center justify-center text-left gap-4">
                               <div aria-hidden="true" className="w-8 h-8 flex-shrink-0 text-blue-400"><ShareIcon /></div>
                               <p className="text-gray-300">No navegador Safari, toque no ícone de <span className="font-semibold text-white">Compartilhar</span> e depois em <span className="font-semibold text-white">"Adicionar à Tela de Início"</span>.</p>
                            </div>
                        </div>
                        <div className="bg-night-800/50 border border-night-700 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-white">Para Android</h3>
                             <div className="mt-4 flex items-center justify-center text-left gap-4">
                               <div aria-hidden="true" className="w-8 h-8 flex-shrink-0 text-gray-300"><DotsVerticalIcon /></div>
                               <p className="text-gray-300">No navegador Chrome, toque no <span className="font-semibold text-white">menu (três pontos)</span> e depois em <span className="font-semibold text-white">"Instalar aplicativo"</span>.</p>
                            </div>
                        </div>
                     </div>
                </section>

                <section className="py-16">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-extrabold text-white text-center">Perguntas Frequentes</h2>
                        <div className="mt-8 space-y-2">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-night-800/50 border border-night-700 rounded-lg">
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full flex justify-between items-center text-left p-4 focus:outline-none"
                                        aria-expanded={openFaq === index}
                                        aria-controls={`faq-answer-${index}`}
                                    >
                                        <span className="font-semibold text-white">{faq.q}</span>
                                        <div className="w-5 h-5 text-gray-400">
                                            <ChevronDownIcon className={`transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    <div
                                        id={`faq-answer-${index}`}
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}
                                    >
                                        <p className="text-gray-400 px-4 pb-4">{faq.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="text-center p-6 border-t border-night-800">
                <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} GanhosPro. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;