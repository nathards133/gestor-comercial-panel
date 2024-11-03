import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }) {
  const [nfeEnabled, setNfeEnabled] = useState(() => {
    const stored = localStorage.getItem('nfeEnabled');
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem('nfeEnabled', JSON.stringify(nfeEnabled));
  }, [nfeEnabled]);

  const toggleNfeGeneration = () => {
    setNfeEnabled(prev => !prev);
  };

  const value = {
    nfeEnabled,
    toggleNfeGeneration
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
} 