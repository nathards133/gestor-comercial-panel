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
import CancelIcon from '@mui/icons-material/Cancel';
import BarcodeIcon from '@mui/icons-material/CropFree';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PaymentNotificationList from './PaymentNotificationList';
import { formatarQuantidade } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';
import Quagga from 'quagga';
import PaymentProcessor from './PaymentProcessor';
import { useConfig } from '../contexts/ConfigContext';
import SettingsIcon from '@mui/icons-material/Settings';
import ConfigPanel from './ConfigPanel';

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
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const paymentMethodRef = useRef(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const navigate = useNavigate();

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

    const [isScannerActive, setIsScannerActive] = useState(false);
    const scannerRef = useRef(null);

    const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
    const [currentSaleData, setCurrentSaleData] = useState(null);

    const [configOpen, setConfigOpen] = useState(false);
    const { nfeEnabled } = useConfig();

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
                const method = response.data.method || ''; // Garante valor padrão

                // Verifica se o método armazenado é diferente do que está sendo recuperado
                const storedMethod = localStorage.getItem('mostUsedPaymentMethod') || '';
                if (method !== storedMethod) {
                    setMostUsedPaymentMethod(method);
                    setPaymentMethod(method); // Garante que seja string
                    localStorage.setItem('mostUsedPaymentMethod', method);
                } else {
                    setMostUsedPaymentMethod(storedMethod);
                    setPaymentMethod(storedMethod);
                }
            } catch (error) {
                console.error('Erro ao buscar método de pagamento mais usado:', error);
                setPaymentMethod(''); // Em caso de erro, define como string vazia
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
                if(erro.response && erro.response.status === 401)
                {
                    navigate('/login');
                }
                console.error('Erro ao buscar produtos:', erro);
                setProdutos([]);
            }
        };
        buscarProdutos();
        updateTopSellingProducts();

        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
    }, [apiUrl, updateTopSellingProducts, navigate, produtoInputRef]);

    // const fetchNotifications = useCallback(async () => {
    //     try {
    //         const response = await axios.get(`${apiUrl}/api/payments/notifications`);
    //         setNotifications(response.data);
    //     } catch (error) {
    //         console.error('Erro ao buscar notificações:', error);
    //     }
    // }, [apiUrl]);

    // useEffect(() => {
    //     fetchNotifications();
    //     const interval = setInterval(fetchNotifications, 30000); // Atualiza a cada 30 segundos
    //     return () => clearInterval(interval);
    // }, [fetchNotifications]);

    const addNotification = useCallback((sale) => {
        const newNotification = {
            message: `Venda realizada: R$ ${sale.total.toFixed(2)}`,
            data: {
                amount: sale.total,
                paymentMethod: sale.paymentMethod
            },
            createdAt: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

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
        // const storedMethod = localStorage.getItem('mostUsedPaymentMethod');
        // if (storedMethod) {
        //     setMostUsedPaymentMethod(storedMethod); // Recupera o método armazenado
        //     setPaymentMethod(storedMethod); // Define como método de pagamento atual
        // }
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

    const adicionarProdutoAoCarrinho = useCallback((produto, quantidadeNumerica) => {
        if (!produto) return;
        
        // Verifica se o produto já existe no carrinho
        const produtoExistenteIndex = carrinho.findIndex(item => item._id === produto._id);
        
        setCarrinho(prevCarrinho => {
            if (produtoExistenteIndex !== -1) {
                // Atualiza quantidade do produto existente
                const novoCarrinho = [...prevCarrinho];
                const novaQuantidade = novoCarrinho[produtoExistenteIndex].quantidade + quantidadeNumerica;
                
                if (novaQuantidade > produto.quantity) {
                    setSnackbar({
                        open: true,
                        message: `Atenção: Estoque insuficiente. Disponível: ${produto.quantity} ${produto.unit}`,
                        severity: 'warning'
                    });
                    novoCarrinho[produtoExistenteIndex].quantidade = produto.quantity;
                } else {
                    novoCarrinho[produtoExistenteIndex].quantidade = novaQuantidade;
                }
                
                return novoCarrinho;
            } else {
                // Adiciona novo produto
                if (quantidadeNumerica > produto.quantity) {
                    setSnackbar({
                        open: true,
                        message: `Atenção: Estoque insuficiente. Disponível: ${produto.quantity} ${produto.unit}`,
                        severity: 'warning'
                    });
                    quantidadeNumerica = produto.quantity;
                }
                
                return [...prevCarrinho, { ...produto, quantidade: quantidadeNumerica }];
            }
        });
    }, [carrinho]);

    const adicionarAoCarrinho = useCallback(() => {
        if (produtoSelecionado) {
            let quantidadeNumerica = produtoSelecionado.unit === 'kg' 
                ? parseFloat(quantidade.replace(',', '.')) 
                : parseInt(quantidade, 10);
            
            if (isNaN(quantidadeNumerica) || quantidadeNumerica <= 0) {
                setSnackbar({
                    open: true,
                    message: 'Por favor, insira uma quantidade válida.',
                    severity: 'error'
                });
                return;
            }
            
            adicionarProdutoAoCarrinho(produtoSelecionado, quantidadeNumerica);
            setProdutoSelecionado(null);
            setQuantidade('');
            setInputValue('');
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        }
    }, [produtoSelecionado, quantidade, adicionarProdutoAoCarrinho]);

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
        const saleTotal = carrinho.reduce((acc, item) => acc + item.price * item.quantidade, 0);
        
        setIsFinalizingVenda(true);
        try {
            // Criar venda
            const saleResponse = await axios.post(`${apiUrl}/api/sales`, {
                items: carrinho,
                paymentMethod: paymentMethod
            });

            // Gerar nota fiscal apenas se estiver habilitado
            let nfeResponse = null;
            if (nfeEnabled) {
                try {
                    nfeResponse = await axios.post(`${apiUrl}/api/nfe`, {
                        saleId: saleResponse.data._id
                    });
                } catch (nfeError) {
                    console.error('Erro ao gerar nota fiscal:', nfeError);
                    // Continua o processo mesmo se a nota falhar
                }
            }

            setCarrinho([]);
            setPaymentMethod('');
            setActiveStep(0);
            
            // Mostrar mensagem apropriada
            setSnackbar({
                open: true,
                message: nfeEnabled 
                    ? (nfeResponse?.data.success 
                        ? 'Venda finalizada com sucesso! Nota fiscal gerada.'
                        : 'Venda finalizada com sucesso! Erro ao gerar nota fiscal.')
                    : 'Venda finalizada com sucesso!',
                severity: 'success',
                action: nfeResponse?.data.success ? (
                    <Button color="inherit" size="small" onClick={() => window.open(nfeResponse.data.nfeUrl, '_blank')}>
                        Ver NF-e
                    </Button>
                ) : undefined
            });

            updateTopSellingProducts();
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
            addNotification({ total: saleTotal, paymentMethod });
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
    }, [carrinho, paymentMethod, apiUrl, updateTopSellingProducts, addNotification, nfeEnabled]);

    const handleAutocompleteChange = useCallback((event, newValue) => {
        setProdutoSelecionado(newValue);
        if (newValue) {
            setQuantidade('');
            if (quantidadeInputRef.current) {
                quantidadeInputRef.current.focus();
            }
        }
    }, []);

    const handleInputChange = useCallback((event, newInputValue) => {
        setInputValue(newInputValue);
        if (newInputValue === '') {
            setProdutoSelecionado(null);
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
        setPaymentMethod(event.target.value || '');

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

    const cancelarVenda = useCallback(() => {
        setSnackbar({
            open: true,
            message: 'Venda cancelada com sucesso.',
            severity: 'info'
        });
        setCarrinho([]);
        setProdutoSelecionado(null);
        setQuantidade('');
        setPaymentMethod('');
        setActiveStep(0);
        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
    }, []);

    const handleBarcodeInputChange = (event) => {
        setBarcodeInput(event.target.value);
    };

    const handleBarcodeSubmit = (event) => {
        event.preventDefault();
        const produto = produtos.find(p => p.barcode === barcodeInput);
        if (produto) {
            adicionarProdutoAoCarrinho(produto, 1);
            setSnackbar({
                open: true,
                message: `${produto.name} adicionado ao carrinho`,
                severity: 'success'
            });
        } else {
            setSnackbar({
                open: true,
                message: 'Produto não encontrado',
                severity: 'error'
            });
        }
        setBarcodeInput('');
    };

    // Função para iniciar o scanner
    const startScanner = useCallback(() => {
        if (scannerRef.current) {
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: scannerRef.current,
                    constraints: {
                        facingMode: "environment",
                        width: { min: 640 },
                        height: { min: 480 },
                        aspectRatio: { min: 1, max: 2 }
                    },
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: navigator.hardwareConcurrency || 4,
                decoder: {
                    readers: [
                        "ean_reader",
                        "ean_8_reader",
                        "code_128_reader",
                        "code_39_reader",
                        "upc_reader"
                    ]
                },
                locate: true
            }, (err) => {
                if (err) {
                    console.error("Erro ao iniciar Quagga:", err);
                    return;
                }
                Quagga.start();
                setIsScannerActive(true);
            });

            Quagga.onDetected((result) => {
                if (result.codeResult.code) {
                    const barcode = result.codeResult.code;
                    setBarcodeInput(barcode);
                    const produto = produtos.find(p => p.barcode === barcode);
                    if (produto) {
                        adicionarProdutoAoCarrinho(produto, 1);
                        stopScanner();
                        setSnackbar({
                            open: true,
                            message: `${produto.name} adicionado ao carrinho`,
                            severity: 'success'
                        });
                    } else {
                        setSnackbar({
                            open: true,
                            message: 'Produto não encontrado',
                            severity: 'error'
                        });
                    }
                }
            });
        }
    }, [produtos, adicionarProdutoAoCarrinho]);

    // Função para parar o scanner
    const stopScanner = useCallback(() => {
        Quagga.stop();
        setIsScannerActive(false);
    }, []);

    // Limpar o scanner quando o componente for desmontado
    useEffect(() => {
        return () => {
            if (isScannerActive) {
                stopScanner();
            }
        };
    }, [isScannerActive, stopScanner]);

    const handlePaymentSuccess = async () => {
        setShowPaymentProcessor(false);
        setCarrinho([]);
        setPaymentMethod('');
        setActiveStep(0);
        setSnackbar({
            open: true,
            message: 'Pagamento realizado com sucesso!',
            severity: 'success'
        });
        updateTopSellingProducts();
        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
        if (currentSaleData) {
            addNotification({ 
                total: currentSaleData.total, 
                paymentMethod: currentSaleData.paymentMethod 
            });
        }
    };

    const handlePaymentError = (error) => {
        console.error('Erro no pagamento:', error);
        setSnackbar({
            open: true,
            message: 'Erro ao processar pagamento. Tente novamente.',
            severity: 'error'
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh' }}>
            {/* Painel de Entrada de Produtos */}
            <Box sx={{ 
                width: isMobile ? '100%' : '60%', 
                p: 2, 
                borderRight: isMobile ? 0 : 1, 
                borderBottom: isMobile ? 1 : 0, 
                borderColor: 'divider',
                overflowY: 'auto'
            }}>
                <Typography variant="h5" gutterBottom>
                    Frente de Caixa
                </Typography>

                {/* Leitor de Código de Barras */}
                <form onSubmit={handleBarcodeSubmit}>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Código de Barras"
                            value={barcodeInput}
                            onChange={handleBarcodeInputChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton onClick={() => isScannerActive ? stopScanner() : startScanner()}>
                                            <BarcodeIcon color={isScannerActive ? "primary" : "inherit"} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        
                        {/* Área do Scanner */}
                        {isScannerActive && (
                            <Box 
                                sx={{ 
                                    position: 'relative',
                                    width: '100%',
                                    height: '300px',
                                    mt: 2,
                                    overflow: 'hidden'
                                }}
                            >
                                <div 
                                    ref={scannerRef}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '80%',
                                        height: '2px',
                                        bgcolor: 'error.main',
                                        boxShadow: '0 0 8px rgba(255,0,0,0.5)'
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                </form>

                {/* Seleção de Produto e Quantidade */}
                <Autocomplete
                    options={produtos || []}
                    getOptionLabel={(option) => {
                        if (!option) return '';
                        if (typeof option === 'string') return option;
                        return option.name ? `${option.name} - R$ ${option.price.toFixed(2)} / ${option.unit}` : '';
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Produto"
                            margin="normal"
                            inputRef={produtoInputRef}
                            onKeyDown={handleKeyDown}
                            fullWidth
                        />
                    )}
                    value={produtoSelecionado}
                    onChange={handleAutocompleteChange}
                    onInputChange={handleInputChange}
                    inputValue={inputValue}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    fullWidth
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                />
                <TextField
                    type={isMobile ? "number" : "text"} // Altera para "number" em dispositivos móveis
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
                        inputMode: isMobile ? "decimal" : "text", // Garante teclado numérico em dispositivos móveis
                        pattern: isMobile ? "[0-9]*" : undefined, // Permite apenas números em dispositivos móveis
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={adicionarAoCarrinho}
                    disabled={!produtoSelecionado || !quantidade}
                    fullWidth
                    sx={{ mt: 2, mb: 2 }}
                >
                    Adicionar ao Carrinho
                </Button>

                {/* Lista de Produtos Mais Vendidos */}
                <Box sx={{ mt: 2 }}>
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

            {/* Painel do Carrinho e Finalização */}
            <Box sx={{ 
                width: isMobile ? '100%' : '70%',  // Ajuste a largura para caber no painel
                p: 2, 
                display: 'flex', 
                flexDirection: 'column',
                height: isMobile ? '100%' : '90%' // Ajuste a altura para caber no painel
            }}>
                <Typography variant="h6" gutterBottom>Carrinho de Compras</Typography>
                <List sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: isMobile ? '40vh' : '60vh' }}>
                    {carrinho.map((item, index) => (
                        <ListItem
                            key={index}
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

                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6">
                        Total: R$ {carrinho.reduce((acc, item) => acc + item.price * item.quantidade, 0).toFixed(2)}
                    </Typography>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="payment-method-label">Método de Pagamento</InputLabel>
                        <Select
                            labelId="payment-method-label"
                            value={paymentMethod || ''} // Garante que seja string
                            onChange={handlePaymentMethodChange}
                            label="Método de Pagamento"
                        >
                            <MenuItem value="">Selecione um método</MenuItem>
                            <MenuItem value="dinheiro">Dinheiro</MenuItem>
                            <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                            <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                            <MenuItem value="pix">PIX</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={finalizarVenda}
                        startIcon={isFinalizingVenda ? <CircularProgress size={24} color="inherit" /> : <PaymentIcon />}
                        fullWidth
                        disabled={!paymentMethod || isFinalizingVenda || carrinho.length === 0}
                        sx={{ mt: 2 }}
                    >
                        {isFinalizingVenda ? 'Finalizando...' : 'Finalizar Venda'}
                    </Button>

                    <Button
                        color="error"
                        onClick={cancelarVenda}
                        startIcon={<CancelIcon />}
                        variant="outlined"
                        disabled={carrinho.length === 0}
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Cancelar Venda
                    </Button>
                </Box>
            </Box>

            {/* PaymentProcessor */}
            <PaymentProcessor
                open={showPaymentProcessor}
                onClose={() => setShowPaymentProcessor(false)}
                saleTotal={currentSaleData?.total || 0}
                saleId={currentSaleData?.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
            />

            {/* Snackbar para mensagens */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Adicione o botão de configurações */}
            <IconButton
                onClick={() => setConfigOpen(true)}
                sx={{ position: 'absolute', top: 16, right: 16 }}
            >
                <SettingsIcon />
            </IconButton>

            {/* Adicione o painel de configurações */}
            <ConfigPanel
                open={configOpen}
                onClose={() => setConfigOpen(false)}
            />
        </Box>
    );
};

export default Home;
