import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import BarcodeReader from 'react-barcode-reader';
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
    IconButton
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import ProductImport from './ProductImport';
import { useAuth } from '../contexts/AuthContext';
import WarningMessage from './WarningMessage';
import ProductEditDialog from './ProductEditDialog';

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
    const { user } = useAuth();
    const priceInputRef = useRef(null);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
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

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/products`);
            if (res.data && Array.isArray(res.data.products)) {
                setProducts(res.data.products);
                setPagination({
                    currentPage: res.data.currentPage,
                    totalPages: res.data.totalPages,
                    totalItems: res.data.totalItems
                });
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
                setOpenSnackbar(true);
                fetchProducts();
            } catch (error) {
                console.error('Erro ao salvar o produto:', error);
                setLoading(false);
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

    const handleScan = (data) => {
        setScannedBarcode(data);
        setNewProduct(prevProduct => ({ ...prevProduct, barcode: data }));
        setIsScannerActive(false);
    }

    const handleError = (err) => {
        console.error(err);
    }

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
        setEditingProduct(product);
    };

    const handleSaveEditedProduct = async (editedProduct) => {
        setLoading(true);
        try {
            // Primeiro, excluímos o produto existente
            await axios.delete(`${apiUrl}/api/products?id=${editedProduct._id}`);

            // Em seguida, criamos um novo produto com os dados atualizados
            const { _id, ...productData } = editedProduct; // Removemos o _id para criar um novo registro
            const response = await axios.post(`${apiUrl}/api/products`, productData);

            if (response.status === 201) {
                console.log('Produto atualizado com sucesso:', response.data);
                setLoading(false);
                setEditingProduct(null);
                setOpenSnackbar(true);
                fetchProducts(); // Atualiza a lista de produtos
            } else {
                throw new Error('Falha ao atualizar o produto');
            }
        } catch (error) {
            console.error('Erro ao atualizar o produto:', error);
            setLoading(false);
            // Adicione aqui uma lógica para mostrar uma mensagem de erro ao usuário
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant={isMobile ? "h5" : "h4"} align="center" gutterBottom>
                Lista de Produtos - {user.businessType}
            </Typography>

            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                    Adicionar Produto
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size={isMobile ? "small" : "medium"}>
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
                        {products.map((product) => (
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
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

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
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isScannerActive}
                                onChange={() => setIsScannerActive(!isScannerActive)}
                                name="scannerActive"
                                color="primary"
                            />
                        }
                        label="Ativar Scanner de Código de Barras"
                    />
                    {isScannerActive && (
                        <BarcodeReader
                            onError={handleError}
                            onScan={handleScan}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSaveProduct} color="primary" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
                    Produto salvo com sucesso!
                </Alert>
            </Snackbar>

            {!user.role === 'admin' && <ProductImport onImportComplete={handleImportComplete} />}

            <ProductEditDialog
                open={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                onSave={handleSaveEditedProduct}
                businessType={user.businessType}
            />

        </Box>
    );
};

export default ProductList;