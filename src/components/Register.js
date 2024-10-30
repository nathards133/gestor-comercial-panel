import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Grid, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoImage from '../logo.png';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        company: '',
        city: '',
        salesPassword: '',
        businessType: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    const businessTypes = [
        'Açougue',
        'Padaria',
        'Mercearia',
        'Papelaria',
        'Material de Construção',
        'Distribuidora de Bebidas',
        'Sorveteria',
        'Outros'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword || 
            !formData.company || !formData.city || !formData.salesPassword || !formData.businessType) {
            setError('Todos os campos são obrigatórios');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return false;
        }

        if (formData.salesPassword.length !== 4 || !/^\d+$/.test(formData.salesPassword)) {
            setError('A senha de vendas deve conter exatamente 4 dígitos');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);
        try {
            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                setError('Token de registro não fornecido');
                return;
            }

            const response = await axios.post(`${apiUrl}/api/auth/register`, 
                {
                    email: formData.email,
                    password: formData.password,
                    company: formData.company,
                    city: formData.city,
                    salesPassword: formData.salesPassword,
                    businessType: formData.businessType
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 201) {
                navigate('/login');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Erro ao registrar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container sx={{ height: '100vh' }}>
            <Grid item xs={12} sm={6} component={Box} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 4
            }}>
                <Box sx={{ mb: 4 }}>
                    <img src={logoImage} alt="Logo" style={{ width: 100 }} />
                </Box>

                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    Registro de Novo Cliente
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="email"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Senha"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirmar Senha"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="company"
                        label="Nome do Estabelecimento"
                        value={formData.company}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="city"
                        label="Cidade"
                        value={formData.city}
                        onChange={handleChange}
                    />
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="business-type-label">Tipo de Negócio</InputLabel>
                        <Select
                            labelId="business-type-label"
                            name="businessType"
                            value={formData.businessType}
                            label="Tipo de Negócio"
                            onChange={handleChange}
                        >
                            {businessTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="salesPassword"
                        label="Senha da Página de Vendas (4 dígitos)"
                        type="password"
                        inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
                        value={formData.salesPassword}
                        onChange={handleChange}
                    />

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Registrar'}
                    </Button>
                </Box>
            </Grid>
            <Grid item xs={12} sm={6} sx={{
                backgroundImage: 'url(/register-bg.jpg)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />
        </Grid>
    );
};

export default Register; 