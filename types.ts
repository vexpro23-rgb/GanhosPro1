
export interface Entry {
  id: string;
  date: string;
  totalEarnings: number;
  kmDriven: number;
  hoursWorked: number;
  additionalCosts: number;
}

export interface CalculatedMetrics {
  grossProfit: number;
  carCost: number;
  netProfit: number;
  profitPerKm: number;
  profitPerHour: number | null;
}

export type View = 'calculator' | 'history' | 'settings' | 'premium';

export interface GanhosProStore {
    entries: Entry[];
    vehicleCostPerKm: number;
    addEntry: (entry: Omit<Entry, 'id' | 'date'>) => void;
    updateEntry: (entry: Entry) => void;
    deleteEntry: (id: string) => void;
    setVehicleCostPerKm: (cost: number) => void;
    replaceAllEntries: (newEntries: Entry[]) => void;
}