import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    InputAdornment,
    IconButton,
    CircularProgress,
    Box,
    Typography
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { parse, format } from 'date-fns';

const ProductEditDialog = ({ open, onClose, product, onProductUpdated, businessType, userId }) => {
    const [editedProduct, setEditedProduct] = useState({
        name: '',
        price: '',
        quantity: '',
        unit: '',
        barcode: '',
        minStockLevel: 5,
        expirationDate: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const priceInputRef = useRef(null);
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (product) {
            setEditedProduct({
                _id: product._id,
                name: product.name || '',
                price: product.price || '',
                quantity: product.quantity || '',
                unit: product.unit || getDefaultUnit(businessType),
                barcode: product.barcode || '',
                minStockLevel: product.minStockLevel || 5,
                expirationDate: product.expirationDate ? new Date(product.expirationDate) : null
            });
        }
    }, [product, businessType]);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedProduct(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handlePriceChange = (values) => {
        const { value } = values;
        setEditedProduct(prev => ({ ...prev, price: value }));
        validateField('price', value);
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
            case 'unit':
                error = value.trim() === '' ? 'A unidade é obrigatória' : '';
                break;
            default:
                break;
        }
        setErrors(prevErrors => ({ ...prevErrors, [fieldName]: error }));
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;
    
        // Validar nome
        if (!editedProduct.name.trim()) {
            newErrors.name = 'O nome do produto é obrigatório';
            isValid = false;
        }
    
        // Validar preço
        if (!editedProduct.price || parseFloat(editedProduct.price) <= 0) {
            newErrors.price = 'O preço deve ser maior que zero';
            isValid = false;
        }
    
        // Validar quantidade
        if (editedProduct.quantity === '' || parseFloat(editedProduct.quantity) < 0) {
            newErrors.quantity = 'A quantidade não pode ser negativa';
            isValid = false;
        }
    
        // Validar unidade
        if (!editedProduct.unit.trim()) {
            newErrors.unit = 'A unidade é obrigatória';
            isValid = false;
        }
    
        // Opcional: validar código de barras se necessário
        // if (!editedProduct.barcode.trim()) {
        //     newErrors.barcode = 'O código de barras é obrigatório';
        //     isValid = false;
        // }
    
        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        if (validateForm()) {
            setLoading(true);
            try {
                const updatedProduct = {
                    ...editedProduct,
                    price: parseFloat(editedProduct.price),
                    quantity: parseFloat(editedProduct.quantity),
                    expirationDate: editedProduct.expirationDate ? format(new Date(editedProduct.expirationDate), 'yyyy-MM-dd') : null
                };

                const token = localStorage.getItem('token');
                const response = await axios.put(
                    `${apiUrl}/api/products/${updatedProduct._id}`,
                    updatedProduct,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 200) {
                    onProductUpdated();
                    onClose();
                }
            } catch (error) {
                console.error('Erro ao atualizar o produto:', error);
                setErrors(prev => ({
                    ...prev,
                    submit: 'Erro ao atualizar produto. Tente novamente.'
                }));
            } finally {
                setLoading(false);
            }
        }
    };

    const getUnitOptions = () => {
        switch (businessType) {
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

    const handleDateChange = (date) => {
        setEditedProduct(prev => ({
            ...prev,
            expirationDate: date
        }));
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    name="name"
                    label="Nome do Produto"
                    type="text"
                    fullWidth
                    value={editedProduct.name}
                    onChange={handleInputChange}
                    error={!!errors.name}
                    helperText={errors.name}
                />
                <NumericFormat
                    customInput={(props) => (
                        <TextField
                            {...props}
                            InputProps={{
                                ...props.InputProps,
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
                    )}
                    margin="dense"
                    name="price"
                    label="Preço"
                    fullWidth
                    value={editedProduct.price}
                    onValueChange={handlePriceChange}
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    error={!!errors.price}
                    helperText={errors.price}
                />
                <TextField
                    margin="dense"
                    name="quantity"
                    label="Quantidade"
                    type="number"
                    fullWidth
                    value={editedProduct.quantity}
                    onChange={handleInputChange}
                    error={!!errors.quantity}
                    helperText={errors.quantity}
                />
                <TextField
                    margin="dense"
                    name="minStockLevel"
                    label="Quantidade Mínima em Estoque"
                    type="number"
                    fullWidth
                    value={editedProduct.minStockLevel}
                    onChange={handleInputChange}
                    helperText="Defina um valor mínimo para ser alertado quando o estoque estiver baixo"
                />

                <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
                    <DatePicker
                        label="Data de Validade"
                        value={editedProduct.expirationDate}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                fullWidth
                                margin="normal"
                                helperText="Importante para controle de produtos perecíveis"
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
                        <li>Configure alertas de estoque mínimo</li>
                        <li>Para produtos perecíveis, sempre inclua a data de validade</li>
                    </ul>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} color="primary" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductEditDialog;
