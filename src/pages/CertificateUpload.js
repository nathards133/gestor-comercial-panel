import React, { useState } from 'react';
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Alert
} from '@mui/material';
import axios from 'axios';

const CertificateUpload = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.pfx')) {
      setFile(file);
      setError('');
    } else {
      setError('Por favor, selecione um arquivo .pfx válido');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !password) {
      setError('Arquivo e senha são obrigatórios');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Cert = reader.result.split(',')[1];
        
        await axios.post('/api/certificates', {
          certFile: base64Cert,
          password
        });

        setSuccess('Certificado enviado com sucesso!');
        setError('');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Erro ao enviar certificado: ' + error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Upload de Certificado Digital A1
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <input
            accept=".pfx"
            type="file"
            onChange={handleFileChange}
            style={{ marginBottom: 16 }}
          />
          
          <TextField
            fullWidth
            type="password"
            label="Senha do Certificado"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />

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

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            disabled={!file || !password}
          >
            Enviar Certificado
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CertificateUpload; 