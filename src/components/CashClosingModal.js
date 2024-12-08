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
  Alert,
  Grid,
  Divider
} from '@mui/material';

const CashClosingModal = ({ open, onClose, onSubmit, loading, cashData }) => {
  const [values, setValues] = useState({
    cash: '',
    credit: '',
    debit: '',
    pix: ''
  });
  const [observation, setObservation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && cashData) {
      setValues({
        cash: formatCurrency(String(cashData.expectedBalance?.cash || 0)),
        credit: formatCurrency(String(cashData.expectedBalance?.credit || 0)),
        debit: formatCurrency(String(cashData.expectedBalance?.debit || 0)),
        pix: formatCurrency(String(cashData.expectedBalance?.pix || 0))
      });
    } else {
      setValues({
        cash: '',
        credit: '',
        debit: '',
        pix: ''
      });
      setObservation('');
      setError('');
    }
  }, [open, cashData]);

  const formatCurrency = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/^0+/, '');
    value = value.padStart(3, '0');
    value = value.slice(0, -2) + ',' + value.slice(-2);
    return value;
  };

  const handleValueChange = (method) => (event) => {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value) {
      const formatted = formatCurrency(value);
      setValues(prev => ({
        ...prev,
        [method]: formatted
      }));
    } else {
      setValues(prev => ({
        ...prev,
        [method]: ''
      }));
    }
    setError('');
  };

  const handleSubmit = () => {
    const finalValues = Object.entries(values).reduce((acc, [method, value]) => {
      acc[method] = value ? parseFloat(value.replace(',', '.')) : 0;
      return acc;
    }, {});

    if (Object.values(finalValues).every(v => v === 0)) {
      setError('Por favor, insira pelo menos um valor');
      return;
    }

    onSubmit({
      values: finalValues,
      observation: observation.trim()
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Fechamento de Caixa</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {/* Resumo do Caixa */}
          <Typography variant="h6" gutterBottom>
            Resumo do Caixa
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Valor Inicial: R$ {cashData?.initialAmount?.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Vendas: R$ {cashData?.totalSales?.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sangrias: R$ {cashData?.totalWithdrawals?.toFixed(2).replace('.', ',')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Saldo Esperado por Método:
              </Typography>
              {cashData?.expectedBalance && Object.entries(cashData.expectedBalance).map(([method, value]) => (
                <Typography key={method} variant="body2" color="text.secondary">
                  {method.charAt(0).toUpperCase() + method.slice(1)}: R$ {value.toFixed(2).replace('.', ',')}
                </Typography>
              ))}
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Campos de Entrada */}
          <Typography variant="h6" gutterBottom>
            Valores em Caixa
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(values).map(([method, value]) => (
              <Grid item xs={12} sm={6} key={method}>
                <TextField
                  fullWidth
                  label={`Valor em ${method.charAt(0).toUpperCase() + method.slice(1)}`}
                  value={value}
                  onChange={handleValueChange(method)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <TextField
            fullWidth
            label="Observações"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={loading}
            multiline
            rows={3}
            sx={{ mt: 2 }}
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
          disabled={loading || Object.values(values).every(v => !v)}
        >
          Fechar Caixa
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CashClosingModal; 