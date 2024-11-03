import React, { useState, useCallback, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Typography, Box, TextField,
  Stepper, Step, StepLabel, Alert
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useConfig } from '../contexts/ConfigContext';

const PaymentProcessor = ({ 
  open, 
  onClose, 
  saleTotal, 
  saleId, 
  onSuccess, 
  onError 
}) => {
  const [status, setStatus] = useState('initial');
  const [paymentId, setPaymentId] = useState(null);
  const [error, setError] = useState(null);
  const [cpf, setCpf] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [nfeStatus, setNfeStatus] = useState(null);
  const [nfeUrl, setNfeUrl] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [provider, setProvider] = useState(null);
  const [checkInterval, setCheckInterval] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const { nfeEnabled } = useConfig();

  const steps = [
    'Informações do Cliente',
    'Processando Pagamento',
    'Gerando Nota Fiscal',
    'Concluído'
  ];

  const handleCpfChange = (event) => {
    let value = event.target.value;
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setCpf(value);
    }
  };

  const simulatePayment = async () => {
    try {
      setStatus('processing');
      setActiveStep(1);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simular pagamento bem sucedido
      const paymentResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/payment-integrations/simulate`, {
        amount: saleTotal,
        saleId,
        customerCpf: cpf.replace(/\D/g, '')
      });

      if (paymentResponse.data.success) {
        if (nfeEnabled) {
          // Gerar nota fiscal apenas se estiver habilitado
          await generateNFe();
        } else {
          setActiveStep(3);
          onSuccess();
        }
      } else {
        throw new Error('Simulação de pagamento falhou');
      }
    } catch (error) {
      console.error('Erro na simulação:', error);
      setStatus('error');
      setError(error.message);
      onError?.(error);
    }
  };

  const generateNFe = async () => {
    try {
      setActiveStep(2);
      setNfeStatus('generating');

      const response = await axios.post('/api/nfe', {
        saleId,
        customerCpf: cpf.replace(/\D/g, '')
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = response.data;

      if (data.success) {
        setNfeUrl(data.nfeUrl);
        setNfeStatus('success');
        setActiveStep(3);
        onSuccess({ nfeUrl: data.nfeUrl });
      } else {
        throw new Error(data.message || 'Erro ao gerar NFe');
      }
    } catch (error) {
      setNfeStatus('error');
      handleError(error);
    }
  };

  const handleError = (error) => {
    setStatus('error');
    setError(error.message);
    onError?.(error);
  };

  const handleStart = () => {
    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      setError('CPF inválido');
      return;
    }
    setError(null);
    simulatePayment();
  };

  const handleRetry = async () => {
    if (retryCount >= 3) {
      setError('Número máximo de tentativas excedido');
      return;
    }

    setRetryCount(prev => prev + 1);
    setStatus('processing');
    setError(null);

    try {
      setStatus('processing');
      setActiveStep(1);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payment-integrations/card`, {
        amount: saleTotal,
        saleId,
        customerCpf: cpf.replace(/\D/g, '')
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = response.data;
      
      if (data.success) {
        setPaymentId(data.paymentId);
        
        if (!data.hasApp) {
          window.location.href = data.fallbackUrl;
          return;
        }
        
        window.location.href = data.deeplinkUrl;
        startPaymentCheck();
      } else {
        throw new Error(data.message || 'Erro ao iniciar pagamento');
      }
    } catch (error) {
      handleError(error);
    }
  };

  const startPaymentCheck = useCallback(() => {
    // Verificar status a cada 3 segundos
    const interval = setInterval(async () => {
      await checkPaymentStatus();
    }, 3000);
    
    setCheckInterval(interval);

    // Parar de verificar após 5 minutos (tempo máximo de espera)
    setTimeout(() => {
      if (checkInterval) {
        clearInterval(checkInterval);
        setCheckInterval(null);
        if (status !== 'success') {
          setStatus('error');
          setError('Tempo limite de pagamento excedido');
        }
      }
    }, 300000); // 5 minutos
  }, [checkInterval]);

  // Limpar intervalo quando componente for desmontado
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/payment-integrations/status`,
        {
          params: { paymentId },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = response.data;
      
      if (data.status === 'completed' || data.status === 'failed') {
        // Limpar intervalo quando tiver uma resposta definitiva
        if (checkInterval) {
          clearInterval(checkInterval);
          setCheckInterval(null);
        }

        if (data.status === 'completed') {
          setStatus('success');
          setActiveStep(3);
          onSuccess?.();
        } else {
          setStatus('error');
          setError(data.errorMessage || 'Pagamento falhou');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      // Não limpar o intervalo em caso de erro de rede
      // para continuar tentando
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Processamento de Pagamento
      </DialogTitle>
      <DialogContent>
        <Box sx={{ width: '100%', mt: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4, mb: 2 }}>
            {activeStep === 0 && (
              <TextField
                label="CPF do Cliente"
                value={cpf}
                onChange={handleCpfChange}
                fullWidth
                error={!!error}
                helperText={error || 'Necessário para emissão da nota fiscal'}
              />
            )}

            {activeStep === 1 && (
              <Box display="flex" flexDirection="column" alignItems="center">
                <CircularProgress />
                <Typography variant="body1" mt={2}>
                  Processando pagamento...
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Tempo restante: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </Typography>
                {provider && (
                  <Typography variant="caption" color="textSecondary">
                    Usando maquininha: {
                      provider === 'infinity_pay' ? 'Infinity Pay' :
                      provider === 'mercado_pago' ? 'Mercado Pago' :
                      provider === 'stone' ? 'Stone' :
                      provider
                    }
                  </Typography>
                )}
              </Box>
            )}

            {activeStep === 2 && (
              <Box display="flex" flexDirection="column" alignItems="center">
                <CircularProgress />
                <Typography variant="body1" mt={2}>
                  Gerando nota fiscal...
                </Typography>
              </Box>
            )}

            {activeStep === 3 && (
              <Box display="flex" flexDirection="column" alignItems="center">
                <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
                <Typography variant="body1" mt={2}>
                  Processo concluído com sucesso!
                </Typography>
                {nfeUrl && (
                  <Button
                    startIcon={<ReceiptIcon />}
                    onClick={() => window.open(nfeUrl, '_blank')}
                    sx={{ mt: 2 }}
                  >
                    Baixar Nota Fiscal
                  </Button>
                )}
              </Box>
            )}

            {status === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {activeStep === 0 && (
          <Button onClick={handleStart} variant="contained" color="primary">
            Iniciar Pagamento
          </Button>
        )}
        <Button onClick={onClose} color="error">
          {activeStep === 3 ? 'Fechar' : 'Cancelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentProcessor; 