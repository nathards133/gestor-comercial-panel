import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Integrations = () => {
  const [integration, setIntegration] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [message, setMessage] = useState(null);
  const { user } = useAuth();

  const handleSave = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/integrations`, {
        integration,
        clientId,
        clientSecret
      });
      setMessage({ type: 'success', text: 'Integração salva com sucesso!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar integração.' });
    }
  };

  if (user.role !== 'admin') {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Integrações</Typography>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Integração</InputLabel>
        <Select
          value={integration}
          onChange={(e) => setIntegration(e.target.value)}
        >
          <MenuItem value="mercadopago">Mercado Pago</MenuItem>
          <MenuItem value="stone">Stone</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Client Secret"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
        type="password"
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleSave}>
        Salvar
      </Button>
    </Box>
  );
};

export default Integrations;
