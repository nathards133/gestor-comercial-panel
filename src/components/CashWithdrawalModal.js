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

const CashWithdrawalModal = ({ open, onClose, onSubmit, loading, currentAmount }) => {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Limpa os campos quando o modal é fechado
  useEffect(() => {
    if (!open) {
      setWithdrawalAmount('');
      setReason('');
      setError('');
    }
  }, [open]);

  const formatCurrency = (value) => {
    value = value.replace(/\D/g, ''); // Remove tudo que não é número
    value = value.replace(/^0+/, ''); // Remove zeros à esquerda
    value = value.padStart(3, '0'); // Garante pelo menos 3 dígitos
    value = value.slice(0, -2) + ',' + value.slice(-2); // Adiciona a vírgula
    return value;
  };

  const handleSubmit = () => {
    const amount = parseFloat(withdrawalAmount.replace(',', '.'));
    
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, insira um valor válido maior que zero');
      return;
    }

    if (amount > currentAmount) {
      setError('O valor da sangria não pode ser maior que o saldo atual do caixa');
      return;
    }

    if (!reason.trim()) {
      setError('Por favor, informe o motivo da sangria');
      return;
    }

    onSubmit({ amount, reason });
  };

  const handleAmountChange = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value) {
      // Converte para centavos e formata
      const formatted = formatCurrency(value);
      setWithdrawalAmount(formatted);
    } else {
      setWithdrawalAmount('');
    }
    setError('');
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Sangria de Caixa</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Saldo atual: R$ {currentAmount.toFixed(2).replace('.', ',')}
          </Typography>
          
          <TextField
            fullWidth
            label="Valor da Sangria"
            value={withdrawalAmount}
            onChange={handleAmountChange}
            disabled={loading}
            error={!!error}
            placeholder="0,00"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
            }}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="Motivo da Sangria"
            value={reason}
            onChange={(e) => {
              if (e.target.value.length <= 15) { // Limite de 15 caracteres
                setReason(e.target.value);
              }
            }}
            disabled={loading}
            multiline
            rows={2}
            sx={{ mt: 2 }}
            inputProps={{ maxLength: 15 }}
            helperText={`${reason.length}/15 caracteres`}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !withdrawalAmount || !reason}
        >
          Confirmar Sangria
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashWithdrawalModal; 