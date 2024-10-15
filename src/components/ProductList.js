import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Snackbar,
    Alert,
    Typography,
    Box,
    Switch,
    FormControlLabel,
    useMediaQuery,
    useTheme,
    MenuItem,
    InputAdornment,
    IconButton,
    Card,
    CardContent,
    Grid,
    Chip,
    Tooltip,
    Divider
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import {
    ArrowForward as ArrowForwardIcon,
    Search as SearchIcon,
    Archive as ArchiveIcon,
    Unarchive as UnarchiveIcon,
    Edit as EditIcon,
    Inventory as InventoryIcon,
} from '@mui/icons-material';
import ProductImport from './ProductImport';
import { useAuth } from '../contexts/AuthContext';
import WarningMessage from './WarningMessage';
import ProductEditDialog from './ProductEditDialog';
import CropFreeIcon from '@mui/icons-material/CropFree';
import Quagga from 'quagga';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', barcode: '', unit: '' });
    const [errors, setErrors] = useState({ name: '', price: '', quantity: '', barcode: '', unit: '' });
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const { user } = useAuth();
    const priceInputRef = useRef(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [isBarcodeReaderOpen, setIsBarcodeReaderOpen] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        fetchProducts();
    }, [showArchived]);

    useEffect(() => {
        // Pré-seleciona a unidade com base no tipo de negócio
        let defaultUnit = 'unidade';
        if (user.businessType === 'Açougue') {
            defaultUnit = 'kg';
        } else if (user.businessType === 'Padaria' || user.businessType === 'Mercearia') {
            defaultUnit = 'g';
        }
        setNewProduct(prev => ({ ...prev, unit: defaultUnit }));
    }, [user.businessType]);

    useEffect(() => {
        if (isBarcodeReaderOpen) {
            initializeQuagga();
        }

        return () => {
            if (Quagga.initialized) {
                Quagga.stop();
            }
            Quagga.offDetected(handleScan);
            // Pare o stream de vídeo quando o componente for desmontado
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [isBarcodeReaderOpen]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/products?showArchived=${showArchived}`);
            if (res.data && Array.isArray(res.data.products)) {
                setProducts(res.data.products);
                setPagination({
                    currentPage: res.data.currentPage,
                    totalPages: res.data.totalPages,
                    totalItems: res.data.totalItems
                });

                // Verifica se não há produtos arquivados e redireciona para ativos
                if (showArchived && res.data.products.length === 0) {
                    setShowArchived(false);
                    setSnackbar({
                        open: true,
                        message: 'Não há produtos arquivados. Mostrando produtos ativos.',
                        severity: 'info'
                    });
                }
            } else {
                console.error('A resposta da API não contém um array de produtos:', res.data);
                setProducts([]);
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            setProducts([]);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setErrors({ name: '', price: '', quantity: '', barcode: '', unit: '' });
        setNewProduct({ name: '', price: '', quantity: '', barcode: '', unit: '' });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewProduct({ name: '', price: '', quantity: '', barcode: '', unit: '' });
        setErrors({ name: '', price: '', quantity: '', barcode: '', unit: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'quantity' && parseFloat(value) < 0) {
            return; // Não permite valores negativos para quantidade
        }
        setNewProduct(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const validateField = (fieldName, value) => {
        let error = '';
        switch (fieldName) {
            case 'name':
                error = value.trim() === '' ? 'O nome do produto é obrigatório' : '';
                break;
            case 'price':
                error = value <= 0 ? 'O preço deve ser maior que zero' : '';
                break;
            case 'quantity':
                error = value < 0 ? 'A quantidade não pode ser negativa' : '';
                break;
            case 'barcode':
                error = value.trim() === '' ? 'O código de barras é obrigatório' : '';
                break;
            case 'unit':
                error = value.trim() === '' ? 'A unidade é obrigatória' : '';
                break;
            default:
                break;
        }
        setErrors(prevErrors => ({ ...prevErrors, [fieldName]: error }));
    };

    const handleSaveProduct = async () => {
        if (validateForm()) {
            setLoading(true);
            try {
                const productData = {
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    quantity: parseFloat(newProduct.quantity),
                    barcode: newProduct.barcode,
                    unit: newProduct.unit
                };
                await axios.post(`${apiUrl}/api/products`, productData);
                setLoading(false);
                handleCloseDialog();
                setSnackbar({
                    open: true,
                    message: 'Produto cadastrado com sucesso!',
                    severity: 'success'
                });
                fetchProducts();
            } catch (error) {
                console.error('Erro ao salvar o produto:', error);
                setLoading(false);
                setSnackbar({
                    open: true,
                    message: 'Erro ao cadastrar o produto. Por favor, tente novamente.',
                    severity: 'error'
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(newProduct).forEach(key => {
            validateField(key, newProduct[key]);
            newErrors[key] = errors[key];
        });
        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleScan = (result) => {
        if (result.codeResult) {
            console.log('Código de barras lido:', result.codeResult.code);
            console.log('Formato:', result.codeResult.format);
            setNewProduct(prevProduct => ({ 
                ...prevProduct, 
                barcode: result.codeResult.code,
                barcodeFormat: result.codeResult.format
            }));
            stopBarcodeScanner();
        }
    };

    const handleError = (err) => {
        console.error(err);
    };

    const handleImportComplete = () => {
        fetchProducts();
    };

    const getUnitOptions = () => {
        switch (user.businessType) {
            case 'Padaria':
            case 'Mercearia':
                return ['kg', 'g', 'unidade'];
            case 'Papelaria':
                return ['unidade', 'pacote'];
            case 'Açougue':
                return ['kg', 'g'];
            case 'Material de Construção':
                return ['unidade', 'm', 'm²', 'm³'];
            default:
                return ['unidade'];
        }
    };

    const handlePriceChange = (values) => {
        const { value } = values;
        setNewProduct(prev => ({ ...prev, price: value }));
        validateField('price', value);
    };

    const moveCursorToCents = () => {
        if (priceInputRef.current) {
            const input = priceInputRef.current.querySelector('input');
            if (input) {
                const value = input.value;
                const commaIndex = value.indexOf(',');
                if (commaIndex !== -1) {
                    input.setSelectionRange(commaIndex + 1, commaIndex + 1);
                } else {
                    input.setSelectionRange(value.length, value.length);
                }
                input.focus();
            }
        }
    };

    const renderBusinessTypeWarning = () => {
        if (user.businessType === 'Açougue') {
            return (
                <WarningMessage
                    title="Atenção Açougues"
                    message="A quantidade inserida deve representar o total do estoque em quilogramas (kg)."
                    severity="info"
                />
            );
        }
        return null;
    };

    const handleEditProduct = (product) => {
        console.log('Abrindo diálogo de edição para o produto:', product);
        setEditingProduct(product);
    };

    const handleProductUpdated = () => {
        fetchProducts();
        setSnackbar({
            open: true,
            message: 'Produto atualizado com sucesso!',
            severity: 'success'
        });
    };

    const handleArchiveProduct = async (productId) => {
        try {
            await axios.patch(`${apiUrl}/api/products?id=${productId}`, { action: true });
            fetchProducts();
            setSnackbar({
                open: true,
                message: 'Produto arquivado com sucesso!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Erro ao arquivar produto:', error);
            setSnackbar({
                open: true,
                message: 'Erro ao arquivar produto. Por favor, tente novamente.',
                severity: 'error'
            });
        }
    };

    const handleUnarchiveProduct = async (productId) => {
        try {
            await axios.patch(`${apiUrl}/api/products?id=${productId}`, { action: false });
            fetchProducts();
            setSnackbar({
                open: true,
                message: 'Produto desarquivado com sucesso!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Erro ao desarquivar produto:', error);
            setSnackbar({
                open: true,
                message: 'Erro ao desarquivar produto. Por favor, tente novamente.',
                severity: 'error'
            });
        }
    };

    const filteredProducts = products.filter(product =>
        (showArchived ? product.archived : !product.archived) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderProductCard = (product) => (
        <Card key={product._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" gutterBottom>
                    {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Preço: R$ {parseFloat(product.price).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Quantidade: {product.quantity} {product.unit}
                </Typography>
                <Box mt={2}>
                    <Chip
                        label={product.archived ? "Arquivado" : "Ativo"}
                        color={product.archived ? "default" : "primary"}
                        size="small"
                    />
                </Box>
            </CardContent>
            <Box sx={{ p: 2, pt: 0 }}>
                <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleEditProduct(product)}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 1 }}
                >
                    Editar
                </Button>
                <Button
                    startIcon={product.archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                    onClick={() => product.archived ? handleUnarchiveProduct(product._id) : handleArchiveProduct(product._id)}
                    fullWidth
                    variant="outlined"
                    color={product.archived ? "primary" : "secondary"}
                >
                    {product.archived ? "Desarquivar" : "Arquivar"}
                </Button>
            </Box>
        </Card>
    );

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const getDefaultUnit = (businessType) => {
        switch (businessType) {
            case 'Açougue':
                return 'kg';
            case 'Padaria':
            case 'Mercearia':
                return 'g';
            default:
                return 'unidade';
        }
    };

    const stopBarcodeScanner = () => {
        if (Quagga.initialized) {
            Quagga.stop();
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsBarcodeReaderOpen(false);
    };

    const openBarcodeScanner = () => {
        setIsBarcodeReaderOpen(true);
    };

    const initializeQuagga = () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(function(stream) {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                    
                    Quagga.init(
                        {
                            inputStream: {
                                name: "Live",
                                type: "LiveStream",
                                target: videoRef.current,
                                constraints: {
                                    width: 640,
                                    height: 480,
                                    facingMode: "environment",
                                },
                            },
                            locator: {
                                patchSize: "medium",
                                halfSample: true,
                            },
                            numOfWorkers: 2,
                            decoder: {
                                readers: [
                                    {
                                        format: "ean_13_reader",
                                        config: {}
                                    }
                                ]
                            },
                            locate: true,
                        },
                        function(err) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log("Quagga initialization finished");
                            Quagga.start();
                        }
                    );

                    Quagga.onDetected(handleScan);
                })
                .catch(function(err) {
                    console.error("Erro ao acessar a câmera:", err);
                });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {lowStockProducts.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Produtos com estoque baixo: {lowStockProducts.map(p => p.name).join(', ')}
                </Alert>
            )}
            {stockAlerts.map((alert, index) => (
                <Alert key={index} severity="error" sx={{ mb: 2 }}>
                    {alert}
                </Alert>
            ))}
            <Typography variant={isMobile ? "h5" : "h4"} align="center" gutterBottom>
                Estoque de Produtos
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Alert severity="info" icon={<InventoryIcon />}>
                    Esta tela reflete o estoque atual do seu estabelecimento. Mantenha-o atualizado para uma gestão eficiente.
                </Alert>
            </Box>

            <Box display="flex" flexDirection={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "stretch" : "center"} mb={2}>
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Buscar produto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    fullWidth={isMobile}
                    sx={{ mb: isMobile ? 2 : 0 }}
                />
                <Box>
                    <Button
                        variant="outlined"
                        onClick={() => setShowArchived(!showArchived)}
                        sx={{ mr: 1, mb: isMobile ? 1 : 0 }}
                        fullWidth={isMobile}
                    >
                        {showArchived ? 'Mostrar Ativos' : 'Mostrar Arquivados'}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenDialog}
                        fullWidth={isMobile}
                    >
                        Adicionar Produto
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {isMobile || isTablet ? (
                <Grid container spacing={2}>
                    {filteredProducts.map((product) => (
                        <Grid item xs={12} sm={6} key={product._id}>
                            {renderProductCard(product)}
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell align="right">Preço</TableCell>
                                <TableCell align="right">Quantidade</TableCell>
                                <TableCell align="right">Unidade</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product._id}>
                                    <TableCell component="th" scope="row">
                                        {product.name}
                                    </TableCell>
                                    <TableCell align="right">R$ {parseFloat(product.price).toFixed(2)}</TableCell>
                                    <TableCell align="right">{product.quantity}</TableCell>
                                    <TableCell align="right">{product.unit}</TableCell>
                                    <TableCell align="right">
                                        <Button onClick={() => handleEditProduct(product)}>
                                            Editar
                                        </Button>
                                        {product.archived ? (
                                            <IconButton onClick={() => handleUnarchiveProduct(product._id)}>
                                                <UnarchiveIcon />
                                            </IconButton>
                                        ) : (
                                            <IconButton onClick={() => handleArchiveProduct(product._id)}>
                                                <ArchiveIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen={isMobile}>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogContent>
                    {renderBusinessTypeWarning()}
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Nome do Produto"
                        type="text"
                        fullWidth
                        value={newProduct.name}
                        onChange={handleInputChange}
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <NumericFormat
                        customInput={TextField}
                        margin="dense"
                        name="price"
                        label="Preço"
                        fullWidth
                        value={newProduct.price}
                        onValueChange={handlePriceChange}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        isNumericString
                        error={!!errors.price}
                        helperText={errors.price}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={moveCursorToCents}
                                        size="small"
                                    >
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        ref={priceInputRef}
                    />
                    <TextField
                        margin="dense"
                        name="quantity"
                        label="Quantidade"
                        type="number"
                        fullWidth
                        value={newProduct.quantity}
                        onChange={handleInputChange}
                        error={!!errors.quantity}
                        helperText={errors.quantity}
                    />
                    <TextField
                        margin="dense"
                        name="barcode"
                        label="Código de Barras"
                        type="text"
                        fullWidth
                        value={newProduct.barcode}
                        onChange={handleInputChange}
                        error={!!errors.barcode}
                        helperText={errors.barcode}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={openBarcodeScanner}>
                                        <CropFreeIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        select
                        margin="dense"
                        name="unit"
                        label="Unidade"
                        fullWidth
                        value={newProduct.unit}
                        onChange={handleInputChange}
                        error={!!errors.unit}
                        helperText={errors.unit}
                    >
                        {getUnitOptions().map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSaveProduct} color="primary" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {!user.role === 'admin' && <ProductImport onImportComplete={handleImportComplete} />}

            <ProductEditDialog
                open={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                onProductUpdated={handleProductUpdated}
                businessType={user.businessType}
                userId={user._id} // Passando o userId para o ProductEditDialog
            />

            {/* Diálogo para o leitor de código de barras */}
            <Dialog open={isBarcodeReaderOpen} onClose={stopBarcodeScanner}>
                <DialogTitle>Ler Código de Barras</DialogTitle>
                <DialogContent>
                    <Typography>Aponte a câmera para o código de barras</Typography>
                    <div style={{ position: 'relative', width: '100%', height: 300 }}>
                        <video ref={videoRef} style={{ width: '100%', height: '100%' }} />
                        <canvas id="interactive" className="viewport" style={{ position: 'absolute', top: 0, left: 0 }} />
                    </div>
                </DialogContent>
            </Dialog>

        </Box>
    );
};


export default ProductList;