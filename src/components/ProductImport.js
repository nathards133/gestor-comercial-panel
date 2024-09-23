import React, { useState } from 'react';
import axios from 'axios';
import { Button, Input, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext'; // Certifique-se de ter um contexto de autenticação

const ProductImport = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { user } = useAuth(); // Assume que você tem um contexto de autenticação que fornece informações do usuário

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo para importar.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/products/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Certifique-se de enviar o token
        },
      });
      setSuccess(response.data.message);
      if (onImportComplete) onImportComplete();
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao importar produtos.');
    } finally {
      setLoading(false);
    }
  };

  if (user.role !== 'admin') {
    return null; // Não renderiza nada se o usuário não for admin
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Importar Produtos (Apenas Admin)
      </Typography>
      <Input
        type="file"
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        disableUnderline
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleImport}
        disabled={loading || !file}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Importar'}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default ProductImport;
