import React, { useState } from 'react';
import type { GanhosProStore } from '../../types';
import { InformationCircleIcon } from '../Icons';

interface SettingsViewProps {
    store: GanhosProStore;
    showToast: (message: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ store, showToast }) => {
    const { vehicleCostPerKm, setVehicleCostPerKm } = store;
    const [cost, setCost] = useState(vehicleCostPerKm.toString());

    // State for the calculator
    const [calcFuelPrice, setCalcFuelPrice] = useState('');
    const [calcFuel, setCalcFuel] = useState('');
    const [calcKms, setCalcKms] = useState('');
    const [calcExtras, setCalcExtras] = useState('0.20');
    const [calcResult, setCalcResult] = useState<{ totalCost: number; consumption: number } | null>(null);
    
    const handleSave = () => {
        const newCost = parseFloat(cost.replace(',', '.'));
        if (!isNaN(newCost) && newCost >= 0) {
            setVehicleCostPerKm(newCost);
            showToast('Custo por KM salvo com sucesso!');
        } else {
            alert("Por favor, insira um valor de custo válido.");
        }
    };

    const handleCalculate = () => {
        const price = parseFloat(calcFuelPrice.replace(',', '.'));
        const total = parseFloat(calcFuel.replace(',', '.'));
        const kms = parseFloat(calcKms.replace(',', '.'));
        const extras = parseFloat(calcExtras.replace(',', '.'));

        if (isNaN(price) || isNaN(total) || isNaN(kms) || isNaN(extras) || kms <= 0 || price <= 0) {
            alert("Por favor, preencha todos os campos da calculadora com valores válidos.");
            return;
        }

        const liters = total / price;
        const consumption = kms / liters;
        const fuelCostPerKm = total / kms;
        const totalCost = fuelCostPerKm + extras;
        
        setCalcResult({ totalCost, consumption });
    };

    const handleUseCalculatedValue = () => {
        if (calcResult !== null) {
            setCost(calcResult.totalCost.toFixed(3).replace('.', ','));
            setCalcResult(null); // Clear result after using
        }
    };
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">Ajustes</h2>
            
            <div className="bg-night-800/50 border border-night-700 p-6 rounded-lg shadow-xl space-y-4">
                <div>
                    <label htmlFor="cost-per-km" className="block text-lg font-medium text-gray-200">
                        Custo por KM Rodado (R$)
                    </label>
                    <p className="text-sm text-gray-400 mb-4">
                        Esse valor é essencial para um cálculo preciso do seu lucro.
                    </p>
                    <input
                        id="cost-per-km"
                        type="text"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="Ex: 0,75"
                        className="w-full bg-night-700/50 text-white p-3 rounded-md border border-night-600 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition text-center text-xl"
                    />
                </div>
                 <button 
                    onClick={handleSave} 
                    className="w-full text-white font-bold py-3 rounded-md transition-all duration-300 bg-gradient-to-r from-brand-blue to-blue-500 hover:opacity-90"
                >
                    Salvar Custo
                </button>
            </div>

            <div className="bg-night-800/50 border border-night-700 p-4 rounded-lg space-y-4 shadow-xl">
                <div className="text-center">
                    <h4 className="font-semibold text-white">Calculadora Rápida de Custo</h4>
                    <p className="text-xs text-gray-400">Estime seu custo com base no seu último abastecimento.</p>
                </div>
                 <div>
                    <label htmlFor="calc-fuel-price" className="text-sm text-gray-300 block mb-1">Preço por Litro (R$)</label>
                    <input id="calc-fuel-price" type="number" value={calcFuelPrice} onChange={e => setCalcFuelPrice(e.target.value)} placeholder="Ex: 5,89" className="w-full bg-night-700/50 text-white p-2 rounded-md border border-night-600" />
                </div>
                <div>
                    <label htmlFor="calc-fuel" className="text-sm text-gray-300 block mb-1">Valor Total do Abastecimento (R$)</label>
                    <input id="calc-fuel" type="number" value={calcFuel} onChange={e => setCalcFuel(e.target.value)} placeholder="Ex: 250" className="w-full bg-night-700/50 text-white p-2 rounded-md border border-night-600" />
                </div>
                <div>
                    <label htmlFor="calc-kms" className="text-sm text-gray-300 block mb-1">KMs Rodados com o Tanque</label>
                    <input id="calc-kms" type="number" value={calcKms} onChange={e => setCalcKms(e.target.value)} placeholder="Ex: 400" className="w-full bg-night-700/50 text-white p-2 rounded-md border border-night-600" />
                </div>
                <div>
                    <label htmlFor="calc-extras" className="text-sm text-gray-300 block mb-1">Custos Extras por KM</label>
                    <p className="text-xs text-gray-400 mb-2">Sugestão: R$ 0,15 a R$ 0,30 para cobrir pneus, óleo, etc.</p>
                    <input id="calc-extras" type="text" value={calcExtras} onChange={e => setCalcExtras(e.target.value)} placeholder="Ex: 0,20" className="w-full bg-night-700/50 text-white p-2 rounded-md border border-night-600" />
                </div>
                    <button onClick={handleCalculate} className="w-full bg-gradient-to-r from-brand-green to-emerald-600 text-white font-bold py-2 rounded-md hover:opacity-90 transition">
                    Calcular
                </button>
                {calcResult !== null && (
                    <div className="text-center bg-night-900/50 border border-night-700 p-4 rounded-lg mt-4 space-y-3 animate-fade-in-up">
                        <div>
                            <p className="text-sm text-gray-400">Consumo médio do veículo:</p>
                            <p className="text-2xl font-bold text-white">{calcResult.consumption.toFixed(2).replace('.', ',')} KM/L</p>
                        </div>
                        <div className="border-t border-night-700/50 my-2"></div>
                        <div>
                            <p className="text-sm text-gray-400">Custo total estimado por KM:</p>
                            <p className="text-3xl font-bold text-brand-green">{calcResult.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 3 })}</p>
                            <p className="text-xs text-gray-500 pt-1">
                                Baseado no seu abastecimento e custos extras.
                            </p>
                        </div>
                        <button onClick={handleUseCalculatedValue} className="!mt-4 w-full bg-gradient-to-r from-brand-blue to-blue-500 text-white font-bold py-2 rounded-md hover:opacity-90 transition text-sm">
                            Usar este Valor
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;