import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Typography, TextField, Button, Grid, Paper, List, ListItem, ListItemText,
    IconButton, Autocomplete, InputAdornment, Box, Stepper, Step, StepLabel,
    useMediaQuery, useTheme, Card, CardContent, Divider, Alert, Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    CircularProgress,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import InfoIcon from '@mui/icons-material/Info';
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
    // const [inputValue, setInputValue] = useState('');    
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [mostUsedPaymentMethod, setMostUsedPaymentMethod] = useState('');
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const paymentMethodRef = useRef(null);

    const apiUrl = process.env.REACT_APP_API_URL;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Adicionar Produtos', 'Revisar Carrinho', 'Finalizar Pagamento'];

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const [isFinalizingVenda, setIsFinalizingVenda] = useState(false);

    const updateTopSellingProducts = useCallback(async () => {
    try {
        const response = await axios.get(`${apiUrl}/api/products/top-selling`);
        const topProducts = response.data.products.slice(0, 3); // Acesse a propriedade 'products'
        setTopSellingProducts(topProducts);
        localStorage.setItem('topSellingProducts', JSON.stringify(topProducts));
    } catch (error) {
        console.error('Erro ao buscar produtos mais vendidos:', error);
    }
}, [apiUrl]);

    useEffect(() => {
        const fetchMostUsedPaymentMethod = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/sales/most-used-payment-method`);
                const method = response.data.method;

                // Verifica se o método armazenado é diferente do que está sendo recuperado
                const storedMethod = localStorage.getItem('mostUsedPaymentMethod');
                if (method !== storedMethod) {
                    setMostUsedPaymentMethod(method);
                    setPaymentMethod(method); // Pré-seleciona o método mais usado
                    localStorage.setItem('mostUsedPaymentMethod', method); // Armazena no localStorage
                } else {
                    // Se o método já estiver armazenado, apenas define o estado
                    setMostUsedPaymentMethod(storedMethod);
                    setPaymentMethod(storedMethod);
                }
            } catch (error) {
                console.error('Erro ao buscar método de pagamento mais usado:', error);
            }
        };

        fetchMostUsedPaymentMethod();
    }, [apiUrl]);

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
        updateTopSellingProducts();

        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
    }, [apiUrl, updateTopSellingProducts]);

    useEffect(() => {
        // const fetchNotifications = async () => {
        //     try {
        //         const response = await axios.get(`${apiUrl}/api/payments/notifications`);
        //         setNotifications(response.data);
        //     } catch (error) {
        //         console.error('Erro ao buscar notificações:', error);
        //     }
        // };

        // fetchNotifications();
        // const interval = setInterval(fetchNotifications, 30000); // Atualiza a cada 30 segundos

        // return () => clearInterval(interval);
    }, [apiUrl]);

    useEffect(() => {
        const storedMethod = localStorage.getItem('mostUsedPaymentMethod');
        if (storedMethod) {
            setMostUsedPaymentMethod(storedMethod); // Recupera o método armazenado
            setPaymentMethod(storedMethod); // Define como método de pagamento atual
        }
    }, []);

    const removerDoCarrinho = useCallback((index) => {
        setCarrinho(prevCarrinho => {
            const novoCarrinho = prevCarrinho.filter((_, i) => i !== index);
            if (novoCarrinho.length === 0) {
                setActiveStep(0);
                setTimeout(() => {
                    if (produtoInputRef.current) {
                        produtoInputRef.current.focus();
                    }
                }, 0);
            } else {
                setTimeout(() => {
                    const listItems = document.querySelectorAll('.carrinho-item');
                    if (listItems.length > 0) {
                        const nextItem = listItems[Math.min(index, listItems.length - 1)];
                        const deleteButton = nextItem.querySelector('button');
                        if (deleteButton) {
                            deleteButton.focus();
                        }
                    }
                }, 0);
            }
            return novoCarrinho;
        });
    }, []);

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
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        }
    }, [produtoSelecionado, quantidade]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeStep === 0) {
                if (produtoSelecionado && e.target === quantidadeInputRef.current) {
                    adicionarAoCarrinho();
                } else if (e.target === produtoInputRef.current) {
                    const firstOption = produtos.find(p =>
                        p.name.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    
                    if (firstOption) {
                        setProdutoSelecionado(firstOption.name);
                        console.log('Produto selecionado:', firstOption.name);
                        quantidadeInputRef.current.focus();
                    }
                }
            } 
        }
    }, [adicionarAoCarrinho, activeStep, produtos,produtoSelecionado]); 
    

    const finalizarVenda = useCallback(async () => {
        setIsFinalizingVenda(true);
        try {
            await axios.post(`${apiUrl}/api/sales`, {
                items: carrinho,
                paymentMethod: paymentMethod
            });
            setCarrinho([]);
            setPaymentMethod('');
            setActiveStep(0); // Redireciona para o passo 0
            setSnackbar({
                open: true,
                message: 'Venda finalizada com sucesso!',
                severity: 'success'
            });
            updateTopSellingProducts(); // Atualiza os produtos mais vendidos
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
            setSnackbar({
                open: true,
                message: 'Erro ao finalizar venda. Tente novamente.',
                severity: 'error'
            });
        } finally {
            setIsFinalizingVenda(false);
        }
    }, [carrinho, paymentMethod, apiUrl, updateTopSellingProducts]);

    const handleAutocompleteChange = useCallback((event, newValue) => {
        setProdutoSelecionado(newValue); // Atualiza o produto selecionado
        if (newValue) {
            setQuantidade(''); // Limpa a quantidade ao selecionar um novo produto
            if (quantidadeInputRef.current) {
                quantidadeInputRef.current.focus(); // Foca na quantidade
            }
        }
    }, []);

    const handleInputChange = useCallback((event, newInputValue) => {
        if (newInputValue === '') {
            setProdutoSelecionado(null); // Limpa a seleção se o input estiver vazio
        }
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

    const handleNext = () => {
        setActiveStep((prevActiveStep) => {
            const nextStep = prevActiveStep + 1;
            if (nextStep === 2 && paymentMethodRef.current) {
                setTimeout(() => paymentMethodRef.current.focus(), 0);
            }
            return nextStep;
        });
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handlePaymentMethodChange = (event) => {
        const selectedMethod = event.target.value;
        setPaymentMethod(selectedMethod);

        // Atualiza o localStorage apenas se o método selecionado for diferente do armazenado
        const storedMethod = localStorage.getItem('mostUsedPaymentMethod');
        if (selectedMethod !== storedMethod) {
            localStorage.setItem('mostUsedPaymentMethod', selectedMethod); // Atualiza o localStorage
        }
    };

    const handlePaymentMethodKeyDown = (event) => {
        if (event.key === 'Enter' && !paymentMethod) {
            setPaymentMethod(mostUsedPaymentMethod);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Adicionar Produtos ao Carrinho</Typography>
                        <Autocomplete
                            options={produtos || []}
                            getOptionLabel={(option) => {
                                if (!option) return '';
                                if (typeof option === 'string') return option;
                                return option.name ? `${option.name} - R$ ${option.price.toFixed(2)} / ${option.unit}` : '';
                            }}
                            getOptionSelected={(option, value) => option._id === value._id}
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
                            startIcon={<AddShoppingCartIcon />}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            Adicionar ao Carrinho
                        </Button>
                        
                        {carrinho.length > 0 && (
                            <Box>
                                <Typography variant="h6" gutterBottom>Itens no Carrinho</Typography>
                                <List>
                                    {carrinho.map((item, index) => (
                                        <ListItem key={index} 
                                            secondaryAction={
                                                <IconButton edge="end" aria-label="delete" onClick={() => removerDoCarrinho(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                            sx={{ 
                                                bgcolor: 'background.paper', 
                                                mb: 1, 
                                                borderRadius: 1,
                                                boxShadow: 1
                                            }}
                                        >
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`${formatarQuantidade(item.quantidade, item.unit)} x R$ ${item.price.toFixed(2)} = R$ ${(item.price * item.quantidade).toFixed(2)}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Revisar Carrinho</Typography>
                        <List onKeyDown={handleKeyDown}>
                            {carrinho.map((item, index) => (
                                <ListItem 
                                    key={index} 
                                    className="carrinho-item"
                                    secondaryAction={
                                        <IconButton 
                                            edge="end" 
                                            aria-label="delete" 
                                            onClick={() => removerDoCarrinho(index) }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    removerDoCarrinho(index);
                                                }
                                            }}
                                            tabIndex={0}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                    sx={{ 
                                        bgcolor: 'background.paper', 
                                        mb: 1, 
                                        borderRadius: 1,
                                        boxShadow: 1
                                    }}
                                >
                                    <ListItemText
                                        primary={item.name}
                                        secondary={`${formatarQuantidade(item.quantidade, item.unit)} x R$ ${item.price.toFixed(2)} = R$ ${(item.price * item.quantidade).toFixed(2)}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                        <Typography variant="h6">
                            Total: R$ {carrinho.reduce((acc, item) => acc + item.price * item.quantidade, 0).toFixed(2)}
                        </Typography>
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Finalizar Pagamento</Typography>
                        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                            Selecione o método de pagamento e finalize a venda.
                            Para pagamentos em cartão ou PIX, aguarde a notificação automática.
                            Para pagamentos em dinheiro, finalize manualmente.
                        </Alert>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="payment-method-label">Método de Pagamento</InputLabel>
                            <Select
                                labelId="payment-method-label"
                                value={paymentMethod}
                                onChange={handlePaymentMethodChange}
                                onKeyDown={handlePaymentMethodKeyDown}
                                label="Método de Pagamento"
                                inputRef={paymentMethodRef}
                            >
                                <MenuItem value="dinheiro">Dinheiro</MenuItem>
                                <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                                <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                                <MenuItem value="pix">PIX</MenuItem>
                            </Select>
                        </FormControl>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Método mais utilizado: {mostUsedPaymentMethod || 'Não disponível'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={finalizarVenda}
                            ref={finalizarVendaButtonRef}
                            onKeyDown={handleKeyDown}
                            startIcon={isFinalizingVenda ? <CircularProgress size={24} color="inherit" /> : <PaymentIcon />}
                            fullWidth
                            disabled={!paymentMethod || isFinalizingVenda}
                        >
                            {isFinalizingVenda ? 'Finalizando...' : 'Finalizar Venda'}
                        </Button>
                    </Box>
                );
            default: return
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant={isMobile ? "h5" : "h4"} align="center" gutterBottom>
                Frente de Caixa
            </Typography>

            <Alert severity="info" align="center" sx={{ mb: 2 }}>
                Bem-vindo ao sistema de Frente de Caixa. Siga os passos abaixo para realizar uma venda.
            </Alert>

            <Stepper  activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Card sx={{ mt: 2 }}>
                <CardContent>
                    {renderStepContent(activeStep)}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button
                    color="inherit"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                >
                    Voltar
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleNext} disabled={activeStep === steps.length - 1}>
                    Próximo
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Ajuste para o canto superior direito
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle1">Produtos mais vendidos</Typography>
                {topSellingProducts.map((product, index) => (
                    <Chip
                        key={product._id}
                        label={`${index + 1}: ${product.name}`}
                        onClick={() => setProdutoSelecionado(product)}
                        sx={{ mr: 1, mb: 1 }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default Home;