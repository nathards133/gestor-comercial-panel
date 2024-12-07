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
    Divider,
    TablePagination,
    FormControl,
    InputLabel,
    Select,
    Badge,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import {
    ArrowForward as ArrowForwardIcon,
    Search as SearchIcon,
    Archive as ArchiveIcon,
    Unarchive as UnarchiveIcon,
    Edit as EditIcon,
    Inventory as InventoryIcon,
    ExpandMore as ExpandMoreIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import WarningMessage from './WarningMessage';
import ProductEditDialog from './ProductEditDialog';
import CropFreeIcon from '@mui/icons-material/CropFree';
import Quagga from 'quagga';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale'; 
import { format, parse } from 'date-fns';
import MarginCalculator from './MarginCalculator';

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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterUnit, setFilterUnit] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({});
    const [isFiltersApplied, setIsFiltersApplied] = useState(false);
    const [expirationDate, setExpirationDate] = useState(null);
    const navigate = useNavigate();
    const [marginCalculatorOpen, setMarginCalculatorOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        unit: '',
        sortBy: 'name',
        sortOrder: 'asc'
    });

    useEffect(() => {
        const savedFilters = JSON.parse(localStorage.getItem('productFilters')) || {};
        setSortBy(savedFilters.sortBy || 'name');
        setSortOrder(savedFilters.sortOrder || 'asc');
        setFilterUnit(savedFilters.filterUnit || '');
        setShowArchived(savedFilters.showArchived || false);
        setAppliedFilters(savedFilters);
        setIsFiltersApplied(Object.keys(savedFilters).length > 0);
        fetchProducts(savedFilters);
    }, []);

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

    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get(`${apiUrl}/api/products`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit: rowsPerPage,
                    search: filters.search,
                    filterUnit: filters.unit,
                    sortBy: filters.sortBy,
                    sortOrder: filters.sortOrder,
                    showArchived: showArchived
                }
            });

            if (response.data) {
                setProducts(response.data.products);
                setPagination({
                    currentPage: response.data.currentPage,
                    totalPages: response.data.totalPages,
                    totalItems: response.data.totalItems
                });
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            setSnackbar({
                open: true,
                message: 'Erro ao carregar produtos',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setErrors({ name: '', price: '', quantity: '', barcode: '', unit: '', expirationDate: '' });
        setNewProduct({ name: '', price: '', quantity: '', barcode: '', unit: '', expirationDate: '' });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewProduct({ name: '', price: '', quantity: '', barcode: '', unit: '', expirationDate: '' });
        setErrors({ name: '', price: '', quantity: '', barcode: '', unit: '', expirationDate: '' });
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
                    unit: newProduct.unit,
                    expirationDate: newProduct.expirationDate
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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSortChange = (event) => {
        setSortBy(event.target.value);
    };

    const handleSortOrderChange = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    
    const handleDateChange = (date) => {
        setNewProduct((prev) => ({ ...prev, expirationDate: date ? date.toISOString() : null }));
    };

    const handleFilterUnitChange = (event) => {
        setFilterUnit(event.target.value);
    };

    const handleApplyFilters = () => {
        const newFilters = {
            sortBy,
            sortOrder,
            filterUnit,
            showArchived
        };
        setAppliedFilters(newFilters);
        setIsFiltersApplied(true);
        localStorage.setItem('productFilters', JSON.stringify(newFilters));
        fetchProducts(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            sortBy: 'name',
            sortOrder: 'asc',
            filterUnit: '',
            showArchived: false
        };
        setSortBy('name');
        setSortOrder('asc');
        setFilterUnit('');
        setShowArchived(false);
        setAppliedFilters(clearedFilters);
        setIsFiltersApplied(false);
        localStorage.removeItem('productFilters');
        fetchProducts(clearedFilters);
    };

    // const renderFilterControls = () => (
        // <Accordion>
        //     <AccordionSummary
        //         expandIcon={<ExpandMoreIcon />}
        //         aria-controls="filter-controls-content"
        //         id="filter-controls-header"
        //     >
        //         <Typography>
        //             Filtros e Ordenação
        //             {isFiltersApplied && (
        //                 <Chip
        //                     size="small"
        //                     label="Filtros aplicados"
        //                     color="primary"
        //                     style={{ marginLeft: 10 }}
        //                 />
        //             )}
        //         </Typography>
        //     </AccordionSummary>
        //     <AccordionDetails>
        //         <Grid container spacing={2} alignItems="center">
        //             <Grid item xs={12} sm={6} md={3}>
        //                 <FormControl fullWidth variant="outlined" size="small">
        //                     <InputLabel>Ordenar por</InputLabel>
        //                     <Select
        //                         value={sortBy}
        //                         onChange={handleSortChange}
        //                         label="Ordenar por"
        //                     >
        //                         <MenuItem value="name">Nome</MenuItem>
        //                         <MenuItem value="price">Preço</MenuItem>
        //                         <MenuItem value="quantity">Quantidade</MenuItem>
        //                     </Select>
        //                 </FormControl>
        //             </Grid>
        //             <Grid item xs={12} sm={6} md={3}>
        //                 <Button 
        //                     onClick={handleSortOrderChange}
        //                     fullWidth
        //                     variant="outlined"
        //                 >
        //                     {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
        //                 </Button>
        //             </Grid>
        //             <Grid item xs={12} sm={6} md={3}>
        //                 <FormControl fullWidth variant="outlined" size="small">
        //                     <InputLabel>Filtrar por unidade</InputLabel>
        //                     <Select
        //                         value={filterUnit}
        //                         onChange={handleFilterUnitChange}
        //                         label="Filtrar por unidade"
        //                     >
        //                         <MenuItem value="">Todas</MenuItem>
        //                         {getUnitOptions().map((unit) => (
        //                             <MenuItem key={unit} value={unit}>{unit}</MenuItem>
        //                         ))}
        //                     </Select>
        //                 </FormControl>
        //             </Grid>
        //             <Grid item xs={12} sm={6} md={3}>
        //                 <Button
        //                     variant="contained"
        //                     color="primary"
        //                     onClick={handleApplyFilters}
        //                     startIcon={<FilterListIcon />}
        //                     fullWidth
        //                 >
        //                     Aplicar Filtros
        //                 </Button>
        //             </Grid>
        //             <Grid item xs={12} sm={6} md={3}>
        //                 <Button
        //                     variant="outlined"
        //                     onClick={handleClearFilters}
        //                     startIcon={<ClearIcon />}
        //                     fullWidth
        //                 >
        //                     Limpar Filtros
        //                 </Button>
        //             </Grid>
        //         </Grid>
        //     </AccordionDetails>
        // </Accordion>
    // );

    const handleMarginCalculation = (calculatedValues) => {
        setNewProduct(prev => ({
            ...prev,
            price: calculatedValues.price,
            quantity: calculatedValues.quantity
        }));
    };

    const handleAddProduct = () => {
        setNewProduct({
            name: '',
            price: '',
            quantity: '',
            barcode: '',
            unit: getDefaultUnit(user.businessType),
            minStockLevel: 5,
            expirationDate: null
        });
        setOpenDialog(true);
    };

    const handleArchivedToggle = () => {
        setShowArchived(!showArchived);
    };

    useEffect(() => {
        fetchProducts(1);
    }, [filters, showArchived]);

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

            <Box sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
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
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddProduct}
                            fullWidth
                        >
                            Adicionar Produto
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setShowArchived(!showArchived);
                                handleApplyFilters();
                            }}
                            fullWidth
                        >
                            {showArchived ? 'Mostrar Ativos' : 'Mostrar Arquivados'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* {renderFilterControls()} */}

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
                                <TableCell align="right">Data de Validade</TableCell> {/* Novo cabeçalho para data de validade */}
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
                                    <TableCell align="right">{product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : 'N/A'}</TableCell> {/* Exibe a data de validade */}
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

            <TablePagination
                component="div"
                count={pagination.totalItems}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
            />

            <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen={isMobile}>
                <DialogTitle>
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
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
                        helperText={errors.name || "Digite o nome completo do produto. Ex: 'Arroz Tipo 1 Marca X 5kg' em vez de apenas 'Arroz'"}
                    />
                    <NumericFormat
                        customInput={TextField}
                        margin="dense"
                        name="price"
                        label="Preço de Venda"
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
                        helperText={errors.price || "Digite o preço final de venda ao cliente. Use o botão 'Calcular Margem' para ajuda com a precificação"}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Clique para mover o cursor para os centavos">
                                        <IconButton
                                            edge="end"
                                            onClick={moveCursorToCents}
                                            size="small"
                                        >
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                        ref={priceInputRef}
                    />
                    <TextField
                        margin="dense"
                        name="quantity"
                        label="Quantidade em Estoque"
                        type="number"
                        fullWidth
                        value={newProduct.quantity}
                        onChange={handleInputChange}
                        error={!!errors.quantity}
                        helperText={errors.quantity || `Digite a quantidade total disponível em estoque. ${
                            user.businessType === 'Açougue' ? 'Para carnes, use o peso total em kg.' :
                            user.businessType === 'Padaria' ? 'Para produtos a granel, use o peso total em kg ou g.' :
                            'Para produtos unitários, digite o número de unidades.'
                        }`}
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
                        helperText={errors.barcode || "Use o leitor de código de barras ou digite manualmente. Para produtos sem código, crie um código interno único"}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Usar câmera para ler código de barras">
                                        <IconButton onClick={openBarcodeScanner}>
                                            <CropFreeIcon />
                                        </IconButton>
                                    </Tooltip>
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
                        required
                    >
                        {getUnitOptions(user.businessType).map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        margin="dense"
                        name="minStockLevel"
                        label="Quantidade Mínima em Estoque"
                        type="number"
                        fullWidth
                        value={newProduct.minStockLevel}
                        onChange={handleInputChange}
                        helperText="Defina um valor mínimo para ser alertado quando o estoque estiver baixo. Recomendamos: 20% da quantidade máxima que você costuma manter"
                    />

                    <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
                        <DatePicker
                            label="Data de Validade"
                            value={newProduct.expirationDate ? parse(newProduct.expirationDate, 'dd/MM/yyyy', new Date()) : null}
                            onChange={handleDateChange}
                            format="dd/MM/yyyy"
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    fullWidth 
                                    margin="normal"
                                    helperText="Importante para controle de produtos perecíveis. Você receberá alertas quando a data estiver próxima"
                                />
                            )}
                        />
                    </LocalizationProvider>

                    <Box sx={{ mt: 2, bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="info.contrastText">
                            💡 Dicas para um bom cadastro:
                        </Typography>
                        <ul>
                            <li>Use nomes descritivos e completos</li>
                            <li>Mantenha as quantidades sempre atualizadas</li>
                            <li>Configure alertas de estoque mínimo para nunca ficar sem produtos</li>
                            <li>Para produtos perecíveis, sempre inclua a data de validade</li>
                        </ul>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Tooltip title="Ajuda para calcular o preço de venda ideal">
                        <Button onClick={() => setMarginCalculatorOpen(true)}>
                            Calcular Margem
                        </Button>
                    </Tooltip>
                    <Button onClick={handleSaveProduct} color="primary" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>

                <MarginCalculator
                    open={marginCalculatorOpen}
                    onClose={() => setMarginCalculatorOpen(false)}
                    product={newProduct}
                    onCalculationApply={handleMarginCalculation}
                />
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

            {/* {!user.role === 'admin' && <ProductImport onImportComplete={handleImportComplete} />} */}

            <ProductEditDialog
                open={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                onProductUpdated={handleProductUpdated}
                businessType={user.businessType}
                userId={user._id}
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
