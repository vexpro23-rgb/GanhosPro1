import React, { useState, useMemo, useRef, KeyboardEvent } from 'react';
import type { GanhosProStore, CalculatedMetrics, Entry } from '../../types.ts';

interface CalculatorViewProps {
    store: GanhosProStore;
    showToast: (message: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; color?: string; isPrimary?: boolean }> = ({ title, value, color = 'text-white', isPrimary = false }) => (
    <div className={`p-4 rounded-lg shadow-md ${isPrimary ? 'bg-brand-green' : 'bg-night-800/50 border border-night-700'}`}>
        <p className={`text-sm ${isPrimary ? 'text-white' : 'text-gray-400'}`}>{title}</p>
        <p className={`text-2xl font-bold ${isPrimary ? 'text-white' : color}`}>{value}</p>
    </div>
);

const CalculatorView: React.FC<CalculatorViewProps> = ({ store, showToast }) => {
    const [earnings, setEarnings] = useState('');
    const [kms, setKms] = useState('');
    const [hours, setHours] = useState('');
    const [costs, setCosts] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [results, setResults] = useState<CalculatedMetrics | null>(null);
    
    const formRef = useRef<HTMLDivElement>(null);

    const calculateMetrics = () => {
        const totalEarnings = parseFloat(earnings) || 0;
        const kmDriven = parseFloat(kms) || 0;
        const hoursWorked = parseFloat(hours) || 0;
        const additionalCosts = parseFloat(costs) || 0;

        if (totalEarnings <= 0 || kmDriven <= 0) {
            alert('Por favor, insira Ganhos Totais e KM Rodados válidos.');
            return;
        }

        const carCost = kmDriven * store.vehicleCostPerKm;
        const netProfit = totalEarnings - carCost - additionalCosts;
        const profitPerKm = netProfit / kmDriven;
        const profitPerHour = hoursWorked > 0 ? netProfit / hoursWorked : null;
        const grossProfitPerKm = kmDriven > 0 ? totalEarnings / kmDriven : 0;


        setResults({
            grossProfit: totalEarnings,
            carCost,
            netProfit,
            profitPerKm,
            profitPerHour,
            grossProfitPerKm,
        });
    };
    
    const handleSave = () => {
        const newEntry: Omit<Entry, 'id'> = {
            date: date,
            totalEarnings: parseFloat(earnings) || 0,
            kmDriven: parseFloat(kms) || 0,
            hoursWorked: parseFloat(hours) || 0,
            additionalCosts: parseFloat(costs) || 0,
        };
        store.addEntry(newEntry);
        showToast('Salvo no histórico!');
        resetForm();
    };

    const resetForm = () => {
        setEarnings('');
        setKms('');
        setHours('');
        setCosts('');
        setDate(new Date().toISOString().split('T')[0]);
        setResults(null);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            
            if (!formRef.current) return;

            const inputs = Array.from(
                formRef.current.querySelectorAll('input[type="number"]')
            ) as HTMLInputElement[];
            const currentIndex = inputs.indexOf(event.currentTarget);
            const nextIndex = currentIndex + 1;

            if (nextIndex < inputs.length) {
                inputs[nextIndex].focus();
            } else {
                calculateMetrics();
            }
        }
    };

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatNumber = (value: number) => value.toFixed(2).replace('.', ',');

    const formFields = [
      { id: 'earnings', label: 'Ganhos Totais (R$)', value: earnings, setter: setEarnings, placeholder: 'Ex: 350,50', type: 'number' },
      { id: 'kms', label: 'KM Rodados', value: kms, setter: setKms, placeholder: 'Ex: 210', type: 'number' },
      { id: 'hours', label: 'Horas Trabalhadas (Opcional)', value: hours, setter: setHours, placeholder: 'Ex: 8,5', type: 'number' },
      { id: 'costs', label: 'Custos Adicionais (Opcional)', value: costs, setter: setCosts, placeholder: 'Ex: 25,00 (lanche, etc)', type: 'number' },
      { id: 'date', label: 'Data do Registro', value: date, setter: setDate, placeholder: '', type: 'date' },
    ];

    return (
        <div className="space-y-6">
            {!results ? (
              <>
                <h2 className="text-2xl font-bold text-white text-center">Calcular Ganhos do Dia</h2>
                <div ref={formRef} className="bg-night-800/50 border border-night-700 p-6 rounded-lg shadow-xl space-y-4">
                  {formFields.map(field => (
                    <div key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                        <input
                            id={field.id}
                            type={field.type}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            onKeyDown={field.type === 'number' ? handleKeyDown : undefined}
                            placeholder={field.placeholder}
                            className="w-full bg-night-700/50 text-white p-3 rounded-md border border-night-600 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition [color-scheme:dark]"
                        />
                    </div>
                  ))}
                  <button onClick={calculateMetrics} className="w-full bg-gradient-to-r from-brand-green to-emerald-600 text-white font-bold py-3 rounded-md hover:opacity-90 transition-all transform hover:scale-105">
                      Calcular Lucro
                  </button>
                </div>
              </>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-white text-center">Seu Resultado</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard title="Lucro Líquido Real" value={formatCurrency(results.netProfit)} color={results.netProfit > 0 ? 'text-green-400' : 'text-red-400'} isPrimary={true}/>
                        <StatCard title="Lucro por KM" value={`${formatCurrency(results.profitPerKm)}/km`} />
                        {results.profitPerHour !== null && <StatCard title="Lucro por Hora" value={`${formatCurrency(results.profitPerHour)}/h`} />}
                        <StatCard title="Ganhos Brutos" value={formatCurrency(results.grossProfit)} />
                        <StatCard title="Custo do Carro" value={formatCurrency(results.carCost)} color="text-yellow-400" />
                        <StatCard title="Ganho Bruto por KM" value={`${formatCurrency(results.grossProfitPerKm)}/km`} />
                    </div>
                    <div className="flex space-x-4">
                         <button onClick={resetForm} className="w-full bg-night-700 text-white font-bold py-3 rounded-md hover:bg-night-600 transition">
                            Novo Cálculo
                        </button>
                        <button onClick={handleSave} className="w-full text-white font-bold py-3 rounded-md transition bg-gradient-to-r from-brand-blue to-blue-500 hover:opacity-90">
                            Salvar no Histórico
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalculatorView;