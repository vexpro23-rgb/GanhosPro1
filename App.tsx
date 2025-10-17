import React, { useState } from 'react';
import BottomNav from './components/BottomNav.tsx';
import CalculatorView from './components/views/CalculatorView.tsx';
import HistoryView from './components/views/HistoryView.tsx';
import SettingsView from './components/views/SettingsView.tsx';
import PremiumView from './components/views/PremiumView.tsx';
import Toast from './components/Toast.tsx';
import { useGanhosProStore } from './hooks/useGanhosProStore.ts';
import type { View } from './types.ts';
import { CalculatorIcon, HistoryIcon, PremiumIcon, SettingsIcon } from './components/Icons.tsx';
import LandingPage from './components/views/LandingPage.tsx';

const App: React.FC = () => {
    const [appLaunched, setAppLaunched] = useState(false);
    const [currentView, setCurrentView] = useState<View>('calculator');
    const store = useGanhosProStore();
    const [toast, setToast] = useState<{ message: string; show: boolean }>({
        message: '',
        show: false,
    });

    const showToast = (message: string) => {
        setToast({ message, show: true });
    };

    const handleLaunchApp = () => {
        setAppLaunched(true);
    };

    if (!appLaunched) {
        return <LandingPage onLaunchApp={handleLaunchApp} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'calculator':
                return <CalculatorView store={store} showToast={showToast} />;
            case 'history':
                return <HistoryView store={store} showToast={showToast} />;
            case 'settings':
                return <SettingsView store={store} showToast={showToast} />;
            case 'premium':
                return <PremiumView store={store} />;
            default:
                return <CalculatorView store={store} showToast={showToast} />;
        }
    };
    
    const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
        { id: 'calculator', label: 'Calcular', icon: <CalculatorIcon /> },
        { id: 'history', label: 'Histórico', icon: <HistoryIcon /> },
        { id: 'premium', label: 'Premium', icon: <PremiumIcon /> },
        { id: 'settings', label: 'Ajustes', icon: <SettingsIcon /> },
    ];

    return (
        <div className="bg-gradient-to-b from-night-900 to-black text-gray-200 min-h-screen font-sans flex flex-col">
            <header className="sticky top-0 bg-night-900/80 backdrop-blur-lg p-4 z-10 border-b border-night-700/50">
                <h1 className="text-xl font-extrabold text-center text-gray-100">
                    Ganhos<span className="text-brand-green">Pro</span>
                </h1>
            </header>
            
            <main key={currentView} className="flex-grow p-4 pb-24 overflow-y-auto animate-fade-in-up">
                {renderView()}
            </main>
            
            <BottomNav
                items={navItems}
                currentView={currentView}
                setCurrentView={setCurrentView}
            />

            <Toast
                message={toast.message}
                show={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default App;