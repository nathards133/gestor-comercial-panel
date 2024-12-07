import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Grid,
    InputAdornment,
    IconButton,
    Tooltip,
    Box,
    Link,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { ArrowForward as ArrowForwardIcon, Info as InfoIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';

const MarginCalculator = ({ open, onClose, product, onCalculationApply }) => {
    const [totalCost, setTotalCost] = useState('');
    const [quantity, setQuantity] = useState('');
    const [profitMargin, setProfitMargin] = useState('');
    const [desiredProfit, setDesiredProfit] = useState('');
    const [results, setResults] = useState(null);
    const priceInputRef = useRef(null);
    const totalCostInputRef = useRef(null);
    const desiredProfitInputRef = useRef(null);

    const calculateMargin = () => {
        const cost = parseFloat(totalCost) || 0;
        const qty = parseInt(quantity) || 0;
        const desired = parseFloat(desiredProfit) || 0;

        if (cost > 0 && qty > 0 && desired > 0) {
            const unitCost = cost / qty;
            const sellingPrice = (cost + desired) / qty;
            const margin = (desired / cost) * 100;
            const roundedMargin = Math.round(margin * 100) / 100;

            setProfitMargin(roundedMargin.toFixed(2));
            setResults({
                unitCost: unitCost.toFixed(2),
                sellingPrice: sellingPrice.toFixed(2),
                totalProfit: desired.toFixed(2),
                marginPercentage: roundedMargin.toFixed(2)
            });
        } else {
            setProfitMargin('');
            setResults(null);
        }
    };

    React.useEffect(() => {
        if (totalCost && quantity && desiredProfit) {
            calculateMargin();
        }
    }, [totalCost, quantity, desiredProfit]);

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

    const handleApplyCalculation = () => {
        if (results && onCalculationApply) {
            onCalculationApply({
                price: parseFloat(results.sellingPrice),
                quantity: parseInt(quantity)
            });
            onClose();
        }
    };

    const clearFields = () => {
        setTotalCost('');
        setQuantity('');
        setProfitMargin('');
        setDesiredProfit('');
        setResults(null);
    };

    const handleClose = () => {
        clearFields();
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Calculadora de Margem de Lucro
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    Simplifique seus cálculos de precificação e maximize seus lucros
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Como usar esta calculadora:
                    </Typography>
                    <Typography variant="body2">
                        1. Digite o valor total que você pagou pelos produtos<br /><br />
                        2. Informe a quantidade total de itens comprados<br /><br />
                        3. Digite quanto você quer ganhar no total<br /><br />
                        4. A calculadora mostrará automaticamente sua margem de lucro!
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <div ref={totalCostInputRef}>
                            <NumericFormat
                                customInput={TextField}
                                margin="dense"
                                label="Custo Total da Compra"
                                fullWidth
                                value={totalCost}
                                onValueChange={(values) => setTotalCost(values.floatValue)}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="R$ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                isNumericString
                                helperText={
                                    <Tooltip title="Este é o valor total que você pagou ao fornecedor, incluindo impostos e frete">
                                        <Box display="flex" alignItems="center">
                                            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                                            Valor total pago ao fornecedor (com impostos e frete)
                                        </Box>
                                    </Tooltip>
                                }
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                edge="end"
                                                onClick={() => moveCursorToCents(totalCostInputRef)}
                                                size="small"
                                            >
                                                <ArrowForwardIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </div>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Quantidade Comprada"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            helperText={
                                <Tooltip title="Quantidade total de produtos que você comprou">
                                    <Box display="flex" alignItems="center">
                                        <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                                        Quantidade total de produtos
                                    </Box>
                                </Tooltip>
                            }
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Margem de Lucro Calculada (%)"
                            value={profitMargin}
                            disabled
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <Tooltip title="Esta é sua margem de lucro calculada automaticamente">
                                        <InfoIcon color="primary" />
                                    </Tooltip>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <div ref={desiredProfitInputRef}>
                            <NumericFormat
                                customInput={TextField}
                                margin="dense"
                                label="Lucro Total Desejado (R$)"
                                fullWidth
                                value={desiredProfit}
                                onValueChange={(values) => setDesiredProfit(values.floatValue)}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="R$ "
                                decimalScale={2}
                                fixedDecimalScale
                                allowNegative={false}
                                isNumericString
                                helperText={
                                    <Tooltip title="Quanto você quer ganhar no total com a venda de todos os produtos">
                                        <Box display="flex" alignItems="center">
                                            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                                            Quanto você quer ganhar no total
                                        </Box>
                                    </Tooltip>
                                }
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                edge="end"
                                                onClick={() => moveCursorToCents(desiredProfitInputRef)}
                                                size="small"
                                            >
                                                <ArrowForwardIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </div>
                    </Grid>
                </Grid>

                {results && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f3f8ff', borderRadius: 1 }}>
                        <Typography variant="h6" color="primary" gutterBottom>
                            Resultados do Cálculo
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Custo por unidade:</strong> R$ {results.unitCost}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                    <strong>Preço sugerido por unidade:</strong> R$ {results.sellingPrice}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Lucro total esperado:</strong> R$ {results.totalProfit}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body1">
                                    <strong>Margem de lucro:</strong> {results.marginPercentage}%
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Capacitação Digital
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Aprenda mais sobre gestão do seu negócio:
                    </Typography>
                    <Link href="https://sebrae.com.br/sites/PortalSebrae/cursos_eventos" target="_blank" display="block">
                        • Cursos gratuitos do SEBRAE
                    </Link>
                    <Link href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" target="_blank" display="block">
                        • Portal do Empreendedor
                    </Link>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Fechar</Button>
                {results && (
                    <Button 
                        onClick={handleApplyCalculation}
                        color="primary"
                        variant="contained"
                    >
                        Aplicar Valores
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

MarginCalculator.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    onCalculationApply: PropTypes.func.isRequired
};

MarginCalculator.defaultProps = {
    product: {}
};

export default MarginCalculator;
