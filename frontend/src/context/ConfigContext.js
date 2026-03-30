import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const ConfigContext = createContext(null);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async (force = false) => {
    if (config && !force) return config;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/site-config`);
      if (!res.ok) throw new Error('Failed to fetch site configuration');
      const data = await res.json();
      setConfig(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Config fetch error:', err);
      setError(err.message);
      // Don't show toast on initial load to avoid cluttering if it's just a slow cold start
      if (force) toast.error('Failed to refresh configuration');
      return null;
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const refreshConfig = () => fetchConfig(true);

  const value = {
    config,
    loading,
    error,
    refreshConfig,
    setConfig // Allow manual updates for optimistic UI in admin
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;
