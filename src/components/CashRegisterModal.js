import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    Tooltip,
    IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

const CashRegisterModal = ({ open, onClose, onSubmit, loading }) => {
    const [initialAmount, setInitialAmount] = useState('');
    const [cashLimit, setCashLimit] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            initialAmount: Number(initialAmount.replace(',', '.')),
            cashLimit: Number(cashLimit.replace(',', '.'))
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Abrir Caixa</DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    O limite de caixa é utilizado para notificar quando o valor em dinheiro físico atingir o limite estabelecido. 
                    Isso ajuda a manter um controle seguro do dinheiro em caixa.
                </Alert>

                <TextField
                    autoFocus
                    margin="dense"
                    label="Valor Inicial"
                    type="text"
                    fullWidth
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                        margin="dense"
                        label="Limite de Dinheiro em Caixa"
                        type="text"
                        fullWidth
                        value={cashLimit}
                        onChange={(e) => setCashLimit(e.target.value)}
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
                    disabled={loading || !initialAmount || !cashLimit}
                >
                    {loading ? 'Abrindo...' : 'Abrir Caixa'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CashRegisterModal; 