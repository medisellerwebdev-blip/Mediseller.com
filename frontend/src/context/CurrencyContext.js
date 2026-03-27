import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('user_currency');
    if (saved) return saved;
    
    // Immediate hint for India (prevents USD flicker)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Calcutta') || timezone.includes('Kolkata') || timezone === 'Asia/Colombo') {
      return 'INR';
    }
    return 'USD';
  });

  useEffect(() => {
    const saved = localStorage.getItem('user_currency');
    
    if (saved) {
      setCurrency(saved);
      console.log('Currency: Loaded from saved preference:', saved);
    } else {
      // Network-based refinement for precise country matching
      const detectCurrency = async () => {
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (response.ok) {
            const data = await response.json();
            if (data.country_code === 'IN') {
              setCurrency('INR');
              console.log('Currency: Refined to INR based on IP location (India)');
            } else if (data.country_code === 'US' || data.country_code === 'GB' || data.country_code === 'CA') {
              // Only switch to USD if it's a major international market or not India
              setCurrency('USD');
              console.log(`Currency: Initialized to USD based on country: ${data.country_name}`);
            }
          }
        } catch (error) {
          console.warn('Currency: Geolocation API failed, using timezone/default.');
        }
      };
      detectCurrency();
    }
  }, []);

  const toggleCurrency = () => {
    const next = currency === 'USD' ? 'INR' : 'USD';
    setCurrency(next);
    localStorage.setItem('user_currency', next);
  };

  const formatPrice = (usdPrice, inrPrice) => {
    if (currency === 'INR') {
      // If inrPrice is missing, fallback to conversion
      const amount = inrPrice || Math.round(usdPrice * 83);
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `$${usdPrice.toFixed(2)}`;
  };

  const getNumericPrice = (usdPrice, inrPrice) => {
    if (currency === 'INR') {
      return inrPrice || Math.round(usdPrice * 83);
    }
    return usdPrice;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      toggleCurrency, 
      formatPrice,
      getNumericPrice,
      symbol: currency === 'INR' ? '₹' : '$'
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
