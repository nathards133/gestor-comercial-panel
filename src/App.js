import React from 'react';
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
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
