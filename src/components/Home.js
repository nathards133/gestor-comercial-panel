import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, TextField, Button, Grid, Paper, List, ListItem, ListItemText, IconButton, Autocomplete, InputAdornment } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PaymentNotificationList from './PaymentNotificationList';
import { formatarQuantidade } from '../utils/formatters';

const Home = () => {
    const [produtos, setProdutos] = useState([]);
    const [produtoSelecionado, setProdutoSelecionado] = useState(null);
    const [quantidade, setQuantidade] = useState('');
    const [carrinho, setCarrinho] = useState([]);
    const produtoInputRef = useRef(null);
    const quantidadeInputRef = useRef(null);
    const finalizarVendaButtonRef = useRef(null);
    const [inputValue, setInputValue] = useState('');
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const buscarProdutos = async () => {
            try {
                const resposta = await axios.get(`${apiUrl}/api/products`);
                setProdutos(Array.isArray(resposta.data.products) ? resposta.data.products : []);
            } catch (erro) {
                console.error('Erro ao buscar produtos:', erro);
                setProdutos([]);
            }
        };
        buscarProdutos();

        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
    }, [apiUrl]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/payments/notifications`);
                setNotifications(response.data);
            } catch (error) {
                console.error('Erro ao buscar notificações:', error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Atualiza a cada 30 segundos

        return () => clearInterval(interval);
    }, [apiUrl]);

    const adicionarAoCarrinho = useCallback(() => {
        if (produtoSelecionado) {
            let quantidadeNumerica = produtoSelecionado.unit === 'kg' 
                ? parseFloat(quantidade.replace(',', '.')) 
                : parseInt(quantidade, 10);
            
            if (isNaN(quantidadeNumerica) || quantidadeNumerica <= 0) {
                alert('Por favor, insira uma quantidade válida.');
                return;
            }
            
            setCarrinho(prevCarrinho => [...prevCarrinho, { 
                ...produtoSelecionado, 
                quantidade: quantidadeNumerica 
            }]);
            setProdutoSelecionado(null);
            setQuantidade('');
            setInputValue('');
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        }
    }, [produtoSelecionado, quantidade]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            if (produtoSelecionado && e.target === quantidadeInputRef.current) {
                adicionarAoCarrinho();
            } else if (produtoSelecionado && e.target === produtoInputRef.current) {
                if (quantidadeInputRef.current) {
                    quantidadeInputRef.current.focus();
                }
            } else if (e.target === finalizarVendaButtonRef.current) {
                finalizarVenda();
            }
        }
    }, [produtoSelecionado, adicionarAoCarrinho]);

    const removerDoCarrinho = useCallback((index) => {
        setCarrinho(prevCarrinho => prevCarrinho.filter((_, i) => i !== index));
    }, []);

    const finalizarVenda = useCallback(async () => {
        try {
            await axios.post(`${apiUrl}/api/sales`, { items: carrinho });
            setCarrinho([]);
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
        }
    }, [carrinho, apiUrl]);

    const handleAutocompleteChange = useCallback((event, newValue) => {
        setProdutoSelecionado(newValue);
        if (newValue && quantidadeInputRef.current) {
            quantidadeInputRef.current.focus();
        }
    }, []);

    const handleInputChange = useCallback((event, newInputValue) => {
        setInputValue(newInputValue);
    }, []);

    const handleQuantidadeChange = (event) => {
        let value = event.target.value;
        if (produtoSelecionado && produtoSelecionado.unit === 'kg') {
            if (value === '0') value = '0,';
            if (!value.startsWith('0,')) value = '0,' + value.replace('0,', '');
        } else {
            value = value.replace(/[^0-9]/g, '');
        }
        setQuantidade(value);
    };

    const handleQuantidadeFocus = (event) => {
        if (produtoSelecionado && produtoSelecionado.unit === 'kg') {
            const input = event.target;
            setTimeout(() => {
                input.setSelectionRange(2, 2);
            }, 0);
        }
    };

    const getUnidadeMedida = () => {
        return produtoSelecionado ? produtoSelecionado.unit : '';
    };

    useEffect(() => {
        if (produtoSelecionado) {
            if (produtoSelecionado.unit === 'kg') {
                setQuantidade('0,');
            } else {
                setQuantidade('');
            }
        }
    }, [produtoSelecionado]);

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h4" align="center" gutterBottom>Frente de Caixa - {user.businessType}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3} style={{ padding: '20px' }}>
                    <Typography variant="h6" align="center" gutterBottom>Adicionar Produto</Typography>
                    <Autocomplete
                        options={produtos}
                        getOptionLabel={(option) => `${option.name} - R$ ${option.price.toFixed(2)} / ${option.unit}`}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Produto"
                                margin="normal"
                                inputRef={produtoInputRef}
                                onKeyDown={handleKeyDown}
                            />
                        )}
                        value={produtoSelecionado}
                        onChange={handleAutocompleteChange}
                        inputValue={inputValue}
                        onInputChange={handleInputChange}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        fullWidth
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                    />
                    <TextField
                        type="text"
                        fullWidth
                        label="Quantidade"
                        value={quantidade}
                        onChange={handleQuantidadeChange}
                        onFocus={handleQuantidadeFocus}
                        margin="normal"
                        inputRef={quantidadeInputRef}
                        onKeyDown={handleKeyDown}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">{getUnidadeMedida()}</InputAdornment>,
                        }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={adicionarAoCarrinho}
                        disabled={!produtoSelecionado}
                    >
                        Adicionar ao Carrinho
                    </Button>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3} style={{ padding: '20px' }}>
                    <Typography variant="h6">Carrinho</Typography>
                    <List>
                        {carrinho.map((item, index) => (
                            <ListItem key={index} secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => removerDoCarrinho(index)}>
                                    <DeleteIcon />
                                </IconButton>
                            }>
                                <ListItemText
                                    primary={`${item.name} - ${formatarQuantidade(item.quantidade, item.unit)} x R$ ${item.price.toFixed(2)}`}
                                    secondary={`Total: R$ ${(item.price * item.quantidade).toFixed(2)}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Typography variant="h6">
                        Total: R$ {carrinho.reduce((acc, item) => acc + item.price * item.quantidade, 0).toFixed(2)}
                    </Typography>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={finalizarVenda}
                        ref={finalizarVendaButtonRef}
                        onKeyDown={handleKeyDown}
                    >
                        Finalizar Venda
                    </Button>
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <PaymentNotificationList notifications={notifications} />
            </Grid>
        </Grid>
    );
};

export default Home;