import React, { useState, useEffect } from 'react';
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
    useTheme
} from '@mui/material';
import { NumericFormat } from 'react-number-format';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', barcode: '' });
    const [errors, setErrors] = useState({ name: '', price: '', quantity: '', barcode: '' });
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
        setErrors({ name: '', price: '', quantity: '', barcode: '' });
        setNewProduct({ name: '', price: '', quantity: '', barcode: '' });
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewProduct({ name: '', price: '', quantity: '', barcode: '' });
        setErrors({ name: '', price: '', quantity: '', barcode: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct({ ...newProduct, [name]: value });
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
                    quantity: parseInt(newProduct.quantity, 10),
                    barcode: newProduct.barcode
                };
                await axios.post('http://localhost:5000/api/products', productData);
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

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant={isMobile ? "h5" : "h4"} align="center" gutterBottom>
                Lista de Produtos
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen={isMobile}>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogContent>
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
                        onValueChange={(values) => {
                            handleInputChange({ target: { name: 'price', value: values.value } });
                        }}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        error={!!errors.price}
                        helperText={errors.price}
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
        </Box>
    );
};

export default ProductList;
