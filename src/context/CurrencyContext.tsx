import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppCurrency } from '../utils/currency';

interface CurrencyContextType {
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
  toggleCurrency: () => void;
}

const STORAGE_KEY_CURRENCY = 'studirad_currency';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<AppCurrency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      return saved === 'USD' ? 'USD' : 'NGN';
    } catch {
      return 'NGN';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, currency);
    } catch {
      // Ignore storage write errors in restricted browsing contexts
    }
  }, [currency]);

  const setCurrency = (next: AppCurrency) => setCurrencyState(next);
  const toggleCurrency = () => setCurrencyState((prev) => (prev === 'NGN' ? 'USD' : 'NGN'));

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
};
