import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import type { GanhosProStore, Entry } from '../../types';
import { TrashIcon, PencilIcon } from '../Icons';

interface HistoryViewProps {
    store: GanhosProStore;
    showToast: (message: string) => void;
}

// Custom Tooltip Component
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-night-900/80 backdrop-blur-sm p-3 rounded-lg border border-night-600 shadow-lg text-sm">
                <p className="font-bold text-white mb-2">{`Data: ${label}`}</p>
                <p className={`text-base font-semibold ${data.Lucro > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {`Lucro: ${formatCurrency(data.Lucro)}`}
                </p>
                <hr className="border-night-700 my-1" />
                <p className="text-yellow-400">{`Custo Carro: ${formatCurrency(data['Custo do Carro'])}`}</p>
                <p className="text-gray-400">{`Custos Extras: ${formatCurrency(data['Custos Extras'])}`}</p>
            </div>
        );
    }
    return null;
};

const EditModal: React.FC<{ entry: Entry; onSave: (updatedEntry: Entry) => void; onClose: () => void }> = ({ entry, onSave, onClose }) => {
    const [formData, setFormData] = useState(entry);

    useEffect(() => {
        setFormData(entry);
    }, [entry]);
    
    // Add keyboard listener for 'Escape' key to close the modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleChange = (field: keyof Omit<Entry, 'id'|'date'>, value: string) => {
        setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleSave = () => {
        onSave(formData);
    };
    
    const formFields = [
        { id: 'totalEarnings-edit', label: 'Ganhos Totais (R$)', value: formData.totalEarnings, handler: (e: React.ChangeEvent<HTMLInputElement>) => handleChange('totalEarnings', e.target.value) },
        { id: 'kmDriven-edit', label: 'KM Rodados', value: formData.kmDriven, handler: (e: React.ChangeEvent<HTMLInputElement>) => handleChange('kmDriven', e.target.value) },
        { id: 'hoursWorked-edit', label: 'Horas Trabalhadas', value: formData.hoursWorked, handler: (e: React.ChangeEvent<HTMLInputElement>) => handleChange('hoursWorked', e.target.value) },
        { id: 'additionalCosts-edit', label: 'Custos Adicionais (R$)', value: formData.additionalCosts, handler: (e: React.ChangeEvent<HTMLInputElement>) => handleChange('additionalCosts', e.target.value) },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
            <div className="bg-night-800 border border-night-700 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 id="edit-modal-title" className="text-xl font-bold text-white text-center">Editar Registro</h3>
                <p className="text-center text-gray-400 text-sm -mt-2">{new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                {formFields.map(field => (
                    <div key={field.id}>
                        <label htmlFor={field.id} className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                        <input id={field.id} type="number" value={field.value} onChange={field.handler} className="w-full bg-night-700/50 text-white p-3 rounded-md border border-night-600" />
                    </div>
                ))}
                <div className="flex space-x-4 pt-4">
                    <button onClick={onClose} className="w-full bg-night-700 text-white font-bold py-3 rounded-md hover:bg-night-600 transition">Cancelar</button>
                    <button onClick={handleSave} className="w-full text-white font-bold py-3 rounded-md transition bg-gradient-to-r from-brand-blue to-blue-500 hover:opacity-90">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

const HistoryView: React.FC<HistoryViewProps> = ({ store, showToast }) => {
    const { entries, vehicleCostPerKm, deleteEntry, updateEntry } = store;
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    
    const recentEntries = useMemo(() => {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        return entries
            .filter(e => new Date(e.date) >= fifteenDaysAgo)
            .sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()); // Sort by creation time for consistency
    }, [entries]);

    const chartData = useMemo(() => {
        return recentEntries.slice(-7).map(entry => { // Use slice(-7) to get last 7
            const carCost = entry.kmDriven * vehicleCostPerKm;
            const netProfit = entry.totalEarnings - carCost - entry.additionalCosts;
            return {
                name: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                Lucro: parseFloat(netProfit.toFixed(2)),
                'Custo do Carro': parseFloat(carCost.toFixed(2)),
                'Custos Extras': parseFloat(entry.additionalCosts.toFixed(2)),
            };
        });
    }, [recentEntries, vehicleCostPerKm]);
    
    const handleSaveEdit = (updatedEntry: Entry) => {
        updateEntry(updatedEntry);
        showToast('Registro atualizado com sucesso!');
        setEditingEntry(null);
    };

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (entries.length === 0) {
        return (
            <div className="text-center text-gray-400 mt-10">
                <h2 className="text-xl font-semibold mb-2">Histórico Vazio</h2>
                <p>Nenhum registro encontrado. Faça seu primeiro cálculo e salve para ver aqui.</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white text-center">Histórico (Últimos 15 dias)</h2>

                {chartData.length > 0 && (
                    <div className="bg-night-800/50 border border-night-700 p-4 rounded-lg shadow-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Lucro Líquido (Últimos 7 dias)</h3>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                        content={<CustomTooltip />}
                                    />
                                    <Bar dataKey="Lucro" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {recentEntries.slice().reverse().map(entry => { // Reverse for display order
                        const carCost = entry.kmDriven * vehicleCostPerKm;
                        const netProfit = entry.totalEarnings - carCost - entry.additionalCosts;
                        
                        return (
                            <div key={entry.id} className="bg-night-800/50 border border-night-700 p-4 rounded-lg shadow-md flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white">{new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                                    <p className={`text-lg font-semibold ${netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(netProfit)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {entry.kmDriven} km • {formatCurrency(entry.totalEarnings)} brutos
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Custos: {formatCurrency(carCost)} (Carro) + {formatCurrency(entry.additionalCosts)} (Extras)
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingEntry(entry)} className="p-2 text-gray-400 hover:text-blue-400 transition-colors" aria-label="Editar registro">
                                        <PencilIcon />
                                    </button>
                                    <button
                                        onClick={() => { if(window.confirm('Tem certeza que deseja apagar este registro?')) deleteEntry(entry.id) }}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        aria-label="Apagar registro"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {editingEntry && <EditModal entry={editingEntry} onSave={handleSaveEdit} onClose={() => setEditingEntry(null)} />}
        </>
    );
};

export default HistoryView;