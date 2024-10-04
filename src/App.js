import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './components/Home';
import ProductList from './components/ProductList';
import Settings from './components/Settings';
import SalesPage from './components/SalesPage';
import StockManagement from './components/Stock';
import SupplierManagement from './components/Supplier';
import Login from './components/Login';
import ReportsPage from './components/ReportsPage';
import Integrations from './components/Integrations';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6a8caf', // Um azul suave
    },
    background: {
      default: '#f5f7fa', // Um cinza muito claro
      paper: '#ffffff',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    background: {
      default: '#303030',
      paper: '#424242',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="products" element={<ProductList />} />
              <Route path="settings" element={<Settings />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="stock" element={<StockManagement />} />
              <Route path="suppliers" element={<SupplierManagement />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="integrations" element={<Integrations />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
