import React, { useEffect } from 'react';
import { CheckCircleIcon } from './Icons';

interface ToastProps {
    message: string;
    show: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Auto-close after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <div
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
                show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
            }`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center bg-green-600/90 backdrop-blur-sm text-white font-semibold py-3 px-5 rounded-full shadow-lg">
                <div className="w-5 h-5 mr-2">
                    <CheckCircleIcon />
                </div>
                <span>{message}</span>
            </div>
        </div>
    );
};

export default Toast;