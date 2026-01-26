import React, { createContext, useContext, useState, ReactNode } from "react";

interface CurrencyContextType {
  selectedCurrency: string;
  exchangeRates: Record<string, number>;
  convertPrice: (price: string | number, targetCurrency?: string) => string;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates (in real implementation, these should be fetched from an API)
const EXCHANGE_RATES = {
  USD: 1,      // Base currency
  CAD: 1.36    // 1 USD = 1.36 CAD (approximate rate)
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("CAD");

  const extractNumericPrice = (price: string | number): number => {
    if (typeof price === "number") return price;
    
    // Extract numeric value from strings like "from $41.00", "$48.00", etc.
    const match = price.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ""));
    }
    return 0;
  };

  const convertPrice = (price: string | number, targetCurrency?: string): string => {
    const currency = targetCurrency || selectedCurrency;
    const numericPrice = extractNumericPrice(price);
    
    if (numericPrice === 0) return typeof price === "string" ? price : `$${price}`;
    
    const convertedPrice = numericPrice * EXCHANGE_RATES[currency as keyof typeof EXCHANGE_RATES];
    const currencySymbol = "$";
    
    // Preserve "from" prefix if it exists
    const hasFromPrefix = typeof price === "string" && price.toLowerCase().includes("from");
    const formattedPrice = `${currencySymbol}${convertedPrice.toFixed(2)}`;
    
    return hasFromPrefix ? `from ${formattedPrice}` : formattedPrice;
  };

  const setCurrency = (currency: string) => {
    setSelectedCurrency(currency);
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    exchangeRates: EXCHANGE_RATES,
    convertPrice,
    setCurrency
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};