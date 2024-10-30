import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const GenerateRegisterLink = () => {
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const { user } = useAuth();
    const apiUrl = process.env.REACT_APP_API_URL;
    const frontendUrl = window.location.origin;

    const generateLink = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                throw new Error('Token de autenticação não encontrado');
            }

            const response = await axios.post(
                `${apiUrl}/api/auth/generate-register-token`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Resposta da API:', response.data);

            if (response.data && response.data.token) {
                const registerLink = `${frontendUrl}/register?token=${response.data.token}`;
                setGeneratedLink(registerLink);
                setSnackbar({
                    open: true,
                    message: 'Link gerado com sucesso!',
                    severity: 'success'
                });
            } else {
                throw new Error('Token não recebido da API');
            }
        } catch (error) {
            console.error('Erro completo:', error);
            setError(error.response?.data?.message || error.message || 'Erro ao gerar link de registro');
            setSnackbar({
                open: true,
                message: 'Erro ao gerar link de registro',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setSnackbar({
            open: true,
            message: 'Link copiado para a área de transferência!',
            severity: 'success'
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Gerar Link de Registro
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                    Gere um link único para que um novo cliente possa se registrar no sistema.
                    Este link será válido por 24 horas.
                </Typography>

                <Button
                    variant="contained"
                    onClick={generateLink}
                    disabled={loading}
                    sx={{ mt: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Gerar Novo Link'}
                </Button>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {generatedLink && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Link gerado:
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1
                        }}>
                            <TextField
                                fullWidth
                                value={generatedLink}
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                            <IconButton 
                                onClick={copyToClipboard}
                                sx={{ ml: 1 }}
                                color="primary"
                            >
                                <ContentCopyIcon />
                            </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Este link expira em 24 horas
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default GenerateRegisterLink; 