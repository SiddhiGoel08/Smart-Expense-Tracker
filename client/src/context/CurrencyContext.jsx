import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const currencySymbols = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'INR');

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const symbol = currencySymbols[currency];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}