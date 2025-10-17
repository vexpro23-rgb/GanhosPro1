import React from 'react';
import type { View } from '../types';

interface NavItem {
    id: View;
    label: string;
    icon: React.ReactNode;
}

interface BottomNavProps {
    items: NavItem[];
    currentView: View;
    setCurrentView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, currentView, setCurrentView }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-night-800/80 backdrop-blur-lg border-t border-night-700/50 flex justify-around">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`relative flex flex-col items-center justify-center w-full py-3 px-1 text-xs transition-colors duration-300 ease-in-out focus:outline-none ${
                        currentView === item.id
                            ? 'text-brand-green'
                            : 'text-gray-400 hover:text-white'
                    }`}
                    aria-current={currentView === item.id ? 'page' : undefined}
                >
                     {currentView === item.id && (
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-brand-green rounded-full transition-all"></span>
                    )}
                    <div className={`w-7 h-7 mb-1 transition-transform duration-300 ease-in-out ${currentView === item.id ? 'scale-110' : 'scale-100'}`}>{item.icon}</div>
                    <span className="font-semibold">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;