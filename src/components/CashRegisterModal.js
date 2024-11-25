import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { formatCurrency } from '../utils/formatters';

const CashRegisterModal = ({ open, onClose, onSubmit, loading }) => {
  const [initialAmount, setInitialAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setInitialAmount('');
      setError('');
    }
  }, [open]);

  const formatCurrency = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/^0+/, '');
    value = value.padStart(3, '0');
    value = value.slice(0, -2) + ',' + value.slice(-2);
    return value;
  };

  const handleSubmit = () => {
    const amount = parseFloat(initialAmount.replace(',', '.'));
    
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, insira um valor válido maior que zero');
      return;
    }

    onSubmit(amount);
  };

  const handleAmountChange = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value) {
      const formatted = formatCurrency(value);
      setInitialAmount(formatted);
    } else {
      setInitialAmount('');
    }
    setError('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown  // Impede fechamento com ESC
      disableBackdropClick  // Impede fechamento ao clicar fora
    >
      <DialogTitle>Abertura de Caixa</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" gutterBottom>
            Insira o valor inicial do caixa (fundo de caixa)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Você pode fechar esta janela e abrir o caixa mais tarde.
          </Typography>
          <TextField
            fullWidth
            label="Valor Inicial"
            value={initialAmount}
            onChange={handleAmountChange}
            disabled={loading}
            error={!!error}
            helperText={error}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
            }}
            sx={{ mt: 2 }}
          />
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !initialAmount}
        >
          Abrir Caixa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashRegisterModal; 