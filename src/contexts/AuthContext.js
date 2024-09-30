import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const company = localStorage.getItem('company');
    const businessType = localStorage.getItem('businessType');
    if (token && email && company && businessType) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token, email, company, businessType });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, { email, password });
      const { token, userId, role, company, businessType } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('email', email);
      localStorage.setItem('company', company);
      localStorage.setItem('businessType', businessType);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ token, userId, role, company, email, businessType });
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('company');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
