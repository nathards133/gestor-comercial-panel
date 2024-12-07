import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Box,
    Typography,
    Tooltip,
    IconButton,
    InputAdornment,
    TextField
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { NumericFormat } from 'react-number-format';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const CashRegisterModal = ({ open, onClose, onSubmit, loading }) => {
    const [initialAmount, setInitialAmount] = useState('');
    const [cashLimit, setCashLimit] = useState('');
    const initialAmountRef = useRef(null);
    const cashLimitRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Extrai apenas os valores numéricos, removendo formatação
        const parsedInitialAmount = parseFloat(initialAmount.replace(/[^\d,]/g, '').replace(',', '.'));
        const parsedCashLimit = parseFloat(cashLimit.replace(/[^\d,]/g, '').replace(',', '.'));
        
        // Verifica se os valores são válidos antes de enviar
        if (isNaN(parsedInitialAmount) || isNaN(parsedCashLimit)) {
            console.error('Valores inválidos:', { initialAmount, cashLimit });
            return;
        }

        // Envia os valores já convertidos para número
        onSubmit({
            initialAmount: parsedInitialAmount,
            cashLimit: parsedCashLimit
        });
    };

    const moveCursorToCents = (inputRef) => {
        if (inputRef.current) {
            const input = inputRef.current.querySelector('input');
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

    const isSubmitDisabled = () => {
        const initialAmountValue = parseFloat(initialAmount) || 0;
        const cashLimitValue = parseFloat(cashLimit) || 0;
        return loading || initialAmountValue <= 0 || cashLimitValue <= 0;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Abrir Caixa</DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    O limite de caixa é utilizado para notificar quando o valor em dinheiro físico atingir o limite estabelecido. 
                    Isso ajuda a manter um controle seguro do dinheiro em caixa.
                </Alert>

                <Box ref={initialAmountRef} sx={{ mb: 2 }}>
                    <NumericFormat
                        customInput={TextField}
                        autoFocus
                        label="Valor Inicial"
                        fullWidth
                        value={initialAmount}
                        onValueChange={(values) => setInitialAmount(values.value)}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        isNumericString
                        helperText="Digite o valor inicial em dinheiro que será colocado no caixa"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Clique para mover o cursor para os centavos">
                                        <IconButton
                                            edge="end"
                                            onClick={() => moveCursorToCents(initialAmountRef)}
                                            size="small"
                                        >
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} ref={cashLimitRef}>
                    <NumericFormat
                        customInput={TextField}
                        label="Limite de Dinheiro em Caixa"
                        fullWidth
                        value={cashLimit}
                        onValueChange={(values) => setCashLimit(values.value)}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        isNumericString
                        helperText="Valor máximo recomendado para manter em caixa"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Clique para mover o cursor para os centavos">
                                        <IconButton
                                            edge="end"
                                            onClick={() => moveCursorToCents(cashLimitRef)}
                                            size="small"
                                        >
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Tooltip title="Quando o valor em dinheiro no caixa atingir este limite, você receberá notificações para realizar uma sangria." arrow>
                        <IconButton size="small">
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    * Você continuará podendo realizar vendas mesmo após atingir o limite.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={isSubmitDisabled()}
                >
                    {loading ? 'Abrindo...' : 'Abrir Caixa'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CashRegisterModal; 