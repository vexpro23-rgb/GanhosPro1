import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps, Cell } from 'recharts';
import type { GanhosProStore, Entry } from '../../types.ts';
import { TrashIcon, PencilIcon } from '../Icons.tsx';

interface HistoryViewProps {
    store: GanhosProStore;
    showToast: (message: string) => void;
}

// Custom Tooltip Component for Chart
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
                <p className="text-gray-300">{`Ganhos Brutos: ${formatCurrency(data['Ganhos Brutos'])}`}</p>
                <p className="text-yellow-400">{`Custo Carro: ${formatCurrency(data['Custo do Carro'])}`}</p>
                <p className="text-gray-400">{`Custos Extras: ${formatCurrency(data['Custos Extras'])}`}</p>
            </div>
        );
    }
    return null;
};

// Reusable StatCard component, similar to the one in CalculatorView
const StatCard: React.FC<{ title: string; value: string; color?: string; isPrimary?: boolean }> = ({ title, value, color = 'text-white', isPrimary = false }) => (
    <div className={`p-4 rounded-lg shadow-md ${isPrimary ? 'bg-brand-green' : 'bg-night-800/50 border border-night-700'}`}>
        <p className={`text-sm ${isPrimary ? 'text-white' : 'text-gray-400'}`}>{title}</p>
        <p className={`text-2xl font-bold ${isPrimary ? 'text-white' : color}`}>{value}</p>
    </div>
);


// Modal for displaying the day's summary
const SummaryModal: React.FC<{ 
    entry: Entry; 
    vehicleCostPerKm: number;
    onClose: () => void;
    onEdit: (entry: Entry) => void;
    onDelete: (id: string) => void; 
}> = ({ entry, vehicleCostPerKm, onClose, onEdit, onDelete }) => {
    const carCost = entry.kmDriven * vehicleCostPerKm;
    const netProfit = entry.totalEarnings - carCost - entry.additionalCosts;
    const profitPerKm = entry.kmDriven > 0 ? netProfit / entry.kmDriven : 0;
    const profitPerHour = entry.hoursWorked > 0 ? netProfit / entry.hoursWorked : null;
    const grossProfitPerKm = entry.kmDriven > 0 ? entry.totalEarnings / entry.kmDriven : 0;


    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleDelete = () => {
        if(window.confirm('Tem certeza que deseja apagar este registro?')) {
            onDelete(entry.id);
        }
    }

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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="summary-modal-title">
            <div className="bg-night-800 border border-night-700 rounded-lg shadow-xl w-full max-w-md p-6 space-y-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h2 id="summary-modal-title" className="text-2xl font-bold text-white text-center">Resumo do Dia</h2>
                <p className="text-center text-gray-400 text-sm -mt-4">{new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Lucro Líquido Real" value={formatCurrency(netProfit)} color={netProfit > 0 ? 'text-green-400' : 'text-red-400'} isPrimary={true}/>
                    <StatCard title="Lucro por KM" value={`${formatCurrency(profitPerKm)}/km`} />
                    {profitPerHour !== null && <StatCard title="Lucro por Hora" value={`${formatCurrency(profitPerHour)}/h`} />}
                    <StatCard title="Ganhos Brutos" value={formatCurrency(entry.totalEarnings)} />
                    <StatCard title="Ganho Bruto por KM" value={`${formatCurrency(grossProfitPerKm)}/km`} />
                    <StatCard title="Custo do Carro" value={formatCurrency(carCost)} color="text-yellow-400" />
                    <StatCard title="Custos Extras" value={formatCurrency(entry.additionalCosts)} color="text-orange-400" />
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => onEdit(entry)} className="w-full flex items-center justify-center gap-2 bg-night-700 text-white font-bold py-3 rounded-md hover:bg-night-600 transition"><PencilIcon /> Editar</button>
                    <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 bg-red-800/50 text-red-400 font-bold py-3 rounded-md hover:bg-red-800/80 transition"><TrashIcon /> Apagar</button>
                </div>
                 <button onClick={onClose} className="w-full bg-gradient-to-r from-brand-blue to-blue-500 text-white font-bold py-3 rounded-md hover:opacity-90 transition">
                    Fechar
                </button>
            </div>
        </div>
    );
};


const EditModal: React.FC<{ entry: Entry; onSave: (updatedEntry: Entry) => void; onClose: () => void }> = ({ entry, onSave, onClose }) => {
    const [formData, setFormData] = useState(entry);

    useEffect(() => {
        setFormData(entry);
    }, [entry]);
    
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
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
    const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
    
    const entriesToDisplay = useMemo(() => {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setHours(0, 0, 0, 0);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);
        return entries
            .filter(e => new Date(e.date) >= fifteenDaysAgo)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [entries]);

    const chartData = useMemo(() => {
        const sourceEntries = entriesToDisplay.slice(-7);

        return sourceEntries.map(entry => {
            const carCost = entry.kmDriven * vehicleCostPerKm;
            const netProfit = entry.totalEarnings - carCost - entry.additionalCosts;
            return {
                name: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                Lucro: parseFloat(netProfit.toFixed(2)),
                'Ganhos Brutos': parseFloat(entry.totalEarnings.toFixed(2)),
                'Custo do Carro': parseFloat(carCost.toFixed(2)),
                'Custos Extras': parseFloat(entry.additionalCosts.toFixed(2)),
            };
        });
    }, [entriesToDisplay, vehicleCostPerKm]);
    
    const handleSaveEdit = (updatedEntry: Entry) => {
        updateEntry(updatedEntry);
        showToast('Registro atualizado com sucesso!');
        setEditingEntry(null);
    };

    const handleEditRequest = (entry: Entry) => {
        setViewingEntry(null);
        setEditingEntry(entry);
    };

    const handleDeleteRequest = (id: string) => {
        deleteEntry(id);
        setViewingEntry(null);
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
                 <h2 className="text-2xl font-bold text-white text-center">
                    Histórico Recente
                </h2>

                {chartData.length > 0 && (
                    <div className="bg-night-800/50 border border-night-700 p-4 rounded-lg shadow-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Lucro Líquido (Últimos 7 dias)
                        </h3>
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
                                    <Bar dataKey="Lucro">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Lucro >= 0 ? '#10B981' : '#F87171'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
                
                {entriesToDisplay.length > 0 ? (
                    <div className="space-y-3">
                        {entriesToDisplay.slice().reverse().map(entry => {
                            const carCost = entry.kmDriven * vehicleCostPerKm;
                            const netProfit = entry.totalEarnings - carCost - entry.additionalCosts;
                            
                            return (
                                <div 
                                    key={entry.id}
                                    className="bg-night-800/50 border border-night-700 p-4 rounded-lg shadow-md flex items-center justify-between hover:bg-night-700/70 transition-colors duration-200 cursor-pointer"
                                    onClick={() => setViewingEntry(entry)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setViewingEntry(entry)}
                                >
                                    <div>
                                        <p className="font-bold text-white">{new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                                        <p className={`text-lg font-semibold ${netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrency(netProfit)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {entry.kmDriven} km • {formatCurrency(entry.totalEarnings)} brutos
                                        </p>
                                    </div>
                                    <div className="text-right">
                                         <p className="text-xs text-gray-400">
                                            Custo Carro: {formatCurrency(carCost)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Extras: {formatCurrency(entry.additionalCosts)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 ) : (
                    <div className="text-center text-gray-400 mt-6 bg-night-800/50 border border-night-700 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-1">Nenhum Registro Recente</h3>
                        <p className="text-sm">Não há dados para os últimos 15 dias. Registros mais antigos podem ser vistos exportando o histórico na tela Premium.</p>
                    </div>
                )}
            </div>
            
            {viewingEntry && <SummaryModal 
                entry={viewingEntry} 
                vehicleCostPerKm={vehicleCostPerKm} 
                onClose={() => setViewingEntry(null)}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
            />}
            
            {editingEntry && <EditModal 
                entry={editingEntry} 
                onSave={handleSaveEdit} 
                onClose={() => setEditingEntry(null)} 
            />}
        </>
    );
};

export default HistoryView;