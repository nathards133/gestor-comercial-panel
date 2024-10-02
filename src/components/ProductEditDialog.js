import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    InputAdornment,
    IconButton
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const ProductEditDialog = ({ open, onClose, product, onSave, businessType }) => {
    const [editedProduct, setEditedProduct] = useState({
        _id: '',
        name: '',
        price: '',
        quantity: '',
        unit: ''
    });
    const [errors, setErrors] = useState({});
    const priceInputRef = useRef(null);

    useEffect(() => {
        if (product) {
            setEditedProduct({
                _id: product._id || '',
                name: product.name || '',
                price: product.price || '',
                quantity: product.quantity || '',
                unit: product.unit || ''
            });
        }
    }, [product]);

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
        Object.keys(editedProduct).forEach(key => {
            validateField(key, editedProduct[key]);
            newErrors[key] = errors[key];
        });
        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSave = () => {
        if (validateForm()) {
            console.log('Dados do produto a serem salvos:', editedProduct);
            onSave(editedProduct);
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
                    customInput={TextField}
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
                    value={editedProduct.quantity}
                    onChange={handleInputChange}
                    error={!!errors.quantity}
                    helperText={errors.quantity}
                />
                <TextField
                    select
                    margin="dense"
                    name="unit"
                    label="Unidade"
                    fullWidth
                    value={editedProduct.unit}
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
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} color="primary">
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductEditDialog;
