import React, { useState, useMemo } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    useMediaQuery,
    useTheme,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';

const ReportsPage = () => {
    const currentYear = new Date().getFullYear();
    const [reportType, setReportType] = useState('');
    const [period, setPeriod] = useState('');
    const [year, setYear] = useState(currentYear);
    const [monthEnd, setMonthEnd] = useState(new Date().getMonth() + 1);
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');

    const handleReportTypeChange = (event) => setReportType(event.target.value);
    const handlePeriodChange = (event) => setPeriod(event.target.value);
    const handleYearChange = (event) => setYear(event.target.value);
    const handleMonthEndChange = (event) => setMonthEnd(event.target.value);

    // Gerar lista de anos disponíveis (de 2024 até o ano atual)
    const availableYears = useMemo(() => {
        const years = [];
        for (let year = 2024; year <= currentYear; year++) {
            years.push(year);
        }
        return years;
    }, [currentYear]);

    const handleExportReport = async () => {
        if (period === 'monthly') {
            setOpenDialog(true);
        } else {
            await exportReport();
        }
    };

    const exportReport = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reports`, {
                params: { type: reportType, period, year, monthEnd },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}_${period}_report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setOpenDialog(false);
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            setError(error.response?.data?.message || 'Erro ao exportar relatório');
        }
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
                Exportação de Relatórios
            </Typography>
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Relatório</InputLabel>
                            <Select value={reportType} label="Tipo de Relatório" onChange={handleReportTypeChange}>
                                <MenuItem value="sales">Vendas</MenuItem>
                                <MenuItem value="inventory">Estoque</MenuItem>
                                <MenuItem value="financial">Financeiro</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Período</InputLabel>
                            <Select value={period} label="Período" onChange={handlePeriodChange}>
                                <MenuItem value="weekly">Semanal</MenuItem>
                                <MenuItem value="monthly">Mensal</MenuItem>
                                <MenuItem value="yearly">Anual</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {period === 'yearly' && (
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Ano</InputLabel>
                                <Select value={year} label="Ano" onChange={handleYearChange}>
                                    {availableYears.map((year) => (
                                        <MenuItem key={year} value={year}>
                                            {year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<CloudDownloadIcon />}
                            onClick={handleExportReport}
                            disabled={!reportType || !period}
                            fullWidth
                        >
                            Exportar Relatório
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Selecione o Mês de Fechamento</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Por favor, selecione o mês de fechamento para o relatório mensal.
                    </DialogContentText>
                    <TextField
                        select
                        fullWidth
                        label="Mês de Fechamento"
                        value={monthEnd}
                        onChange={handleMonthEndChange}
                        margin="dense"
                    >
                        {[...Array(12)].map((_, i) => (
                            <MenuItem key={i} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                    <Button onClick={exportReport} color="primary">Exportar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReportsPage;