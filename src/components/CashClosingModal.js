/* eslint-disable default-case */
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
    dinheiro: '',
    credito: '',
    debito: '',
    pix: ''
  });
  const [observation, setObservation] = useState('');
  const [error, setError] = useState('');

  const calculateExpectedBalances = (transactions, initialAmount) => {
    console.log('Calculando saldos esperados:', { transactions, initialAmount });
    
    const balances = {
      dinheiro: initialAmount || 0,
      credito: 0,
      debito: 0,
      pix: 0
    };

    if (!transactions) return balances;

    transactions.forEach(transaction => {
      const amount = Number(transaction.amount) || 0;

      switch (transaction.type) {
        case 'deposit':
          if (transaction.paymentMethod === 'dinheiro') {
            balances.dinheiro += amount;
          }
          break;
        case 'sale':
          switch (transaction.paymentMethod) {
            case 'dinheiro':
              balances.dinheiro += amount;
              break;
            case 'cartao_credito':
              balances.credito += amount;
              break;
            case 'cartao_debito':
              balances.debito += amount;
              break;
            case 'pix':
              balances.pix += amount;
              break;
          }
          break;
        case 'withdrawal':
          balances.dinheiro -= amount;
          break;
      }
    });

    console.log('Saldos calculados:', balances);
    return balances;
  };

  useEffect(() => {
    if (open && cashData) {
      console.log('CashData recebido:', cashData);
      
      // Verifica se cashData é um array ou objeto único
      const registerData = Array.isArray(cashData) ? cashData[0] : cashData.data;
      
      if (registerData) {
        const expectedBalances = calculateExpectedBalances(
          registerData.transactions,
          registerData.initialAmount
        );

        setValues({
          dinheiro: formatCurrency(expectedBalances.dinheiro || 0),
          credito: formatCurrency(expectedBalances.credito || 0),
          debito: formatCurrency(expectedBalances.debito || 0),
          pix: formatCurrency(expectedBalances.pix || 0)
        });
      }
    }
  }, [open, cashData]);

  const formatCurrency = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(2).replace('.', ',');
    }

    value = value.replace(/[^\d.,]/g, '');

    const parts = value.split(/[.,]/);
    if (parts.length > 2) {
      value = parts[0] + ',' + parts[parts.length - 1];
    }

    const [intPart, decPart] = value.split(',');
    if (decPart && decPart.length > 2) {
      value = intPart + ',' + decPart.slice(0, 2);
    }

    return value;
  };

  const handleValueChange = (method) => (event) => {
    const formatted = formatCurrency(event.target.value);
    setValues(prev => ({
      ...prev,
      [method]: formatted
    }));
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
          <Typography variant="h6" gutterBottom>
            Resumo do Caixa
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Valor Inicial: R$ {(Array.isArray(cashData) ? cashData[0]?.initialAmount : cashData?.data?.initialAmount)?.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Vendas: R$ {calculateTotalSales(Array.isArray(cashData) ? cashData[0]?.transactions : cashData?.data?.transactions)?.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sangrias: R$ {calculateTotalWithdrawals(Array.isArray(cashData) ? cashData[0]?.transactions : cashData?.data?.transactions)?.toFixed(2).replace('.', ',')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Saldo Esperado por Método:
              </Typography>
              {(() => {
                const registerData = Array.isArray(cashData) ? cashData[0] : cashData?.data;
                if (registerData) {
                  const balances = calculateExpectedBalances(registerData.transactions, registerData.initialAmount);
                  return Object.entries(balances).map(([method, value]) => (
                    <Typography key={method} variant="body2" color="text.secondary">
                      {method.charAt(0).toUpperCase() + method.slice(1)}: R$ {value.toFixed(2).replace('.', ',')}
                    </Typography>
                  ));
                }
                return null;
              })()}
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

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

const calculateTotalSales = (transactions) => {
  if (!transactions) return 0;
  return transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

const calculateTotalWithdrawals = (transactions) => {
  if (!transactions) return 0;
  return transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export default CashClosingModal; 