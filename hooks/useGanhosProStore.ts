
import { useState, useEffect, useCallback } from 'react';
import type { Entry, GanhosProStore } from '../types';

const GANHOSPRO_ENTRIES_KEY = 'ganhospro_entries';
const GANHOSPRO_COST_KEY = 'ganhospro_cost_per_km';

export const useGanhosProStore = (): GanhosProStore => {
    const [entries, setEntries] = useState<Entry[]>(() => {
        try {
            const storedEntries = localStorage.getItem(GANHOSPRO_ENTRIES_KEY);
            return storedEntries ? JSON.parse(storedEntries) : [];
        } catch (error) {
            console.error("Error loading entries from localStorage", error);
            return [];
        }
    });

    const [vehicleCostPerKm, setVehicleCostPerKmState] = useState<number>(() => {
        try {
            const storedCost = localStorage.getItem(GANHOSPRO_COST_KEY);
            return storedCost ? parseFloat(storedCost) : 0.75; // Default value
        } catch (error) {
            console.error("Error loading cost from localStorage", error);
            return 0.75;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(GANHOSPRO_ENTRIES_KEY, JSON.stringify(entries));
        } catch (error) {
            console.error("Error saving entries to localStorage", error);
        }
    }, [entries]);

    useEffect(() => {
        try {
            localStorage.setItem(GANHOSPRO_COST_KEY, vehicleCostPerKm.toString());
        } catch (error) {
            console.error("Error saving cost to localStorage", error);
        }
    }, [vehicleCostPerKm]);

    const addEntry = useCallback((newEntryData: Omit<Entry, 'id' | 'date'>) => {
        const newEntry: Entry = {
            ...newEntryData,
            id: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
        };
        setEntries(prevEntries => [...prevEntries, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const updateEntry = useCallback((updatedEntry: Entry) => {
        setEntries(prevEntries =>
            prevEntries.map(entry => (entry.id === updatedEntry.id ? updatedEntry : entry))
        );
    }, []);

    const deleteEntry = useCallback((id: string) => {
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    }, []);

    const setVehicleCostPerKm = useCallback((cost: number) => {
        setVehicleCostPerKmState(cost);
    }, []);

    return {
        entries,
        vehicleCostPerKm,
        addEntry,
        updateEntry,
        deleteEntry,
        setVehicleCostPerKm,
    };
};
