import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Typography, TextField, Button, Grid, Paper, List, ListItem, ListItemText, 
    IconButton, Autocomplete, InputAdornment, Box, Stepper, Step, StepLabel,
    useMediaQuery, useTheme, Card, CardContent, Divider, Alert, Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
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
    const [inputValue, setInputValue] = useState('');
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [mostUsedPaymentMethod, setMostUsedPaymentMethod] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Adicionar Produtos', 'Revisar Carrinho', 'Finalizar Pagamento'];

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

    useEffect(() => {
        const fetchMostUsedPaymentMethod = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/sales/most-used-payment-method`);
                setMostUsedPaymentMethod(response.data.method);
                setPaymentMethod(response.data.method); // Pré-seleciona o método mais usado
            } catch (error) {
                console.error('Erro ao buscar método de pagamento mais usado:', error);
            }
        };

        fetchMostUsedPaymentMethod();
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
            await axios.post(`${apiUrl}/api/sales`, { 
                items: carrinho,
                paymentMethod: paymentMethod 
            });
            setCarrinho([]);
            setPaymentMethod('');
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
        }
    }, [carrinho, paymentMethod, apiUrl]);

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

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Adicionar Produtos ao Carrinho</Typography>
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
                                label="Método de Pagamento"
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
                            startIcon={<PaymentIcon />}
                            fullWidth
                            disabled={!paymentMethod}
                        >
                            Finalizar Venda
                        </Button>
                    </Box>
                );
            default:
                return 'Passo Desconhecido';
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
        </Box>
    );
};

export default Home;