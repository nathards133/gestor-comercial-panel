import React, { useState, useEffect } from 'react';
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
    DialogTitle,
    CircularProgress,
    Alert
} from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

const ReportsPage = () => {
    const [reportType, setReportType] = useState('');
    const [period, setPeriod] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [availableMonths, setAvailableMonths] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [minDate, setMinDate] = useState(null);
    const [maxDate, setMaxDate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [noDataAvailable, setNoDataAvailable] = useState(false);
    const [reportFormat, setReportFormat] = useState('excel');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchAvailableDates();
    }, []);

    const fetchAvailableDates = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/available-dates`);
            const sales = response.data.sales || [];
            
            if (Array.isArray(sales) && sales.length > 0) {
                const months = new Set();
                const years = new Set();
                let minDate = new Date();
                let maxDate = new Date(0);

                sales.forEach(sale => {
                    const date = new Date(sale.createdAt);
                    months.add(date.getMonth() + 1);
                    years.add(date.getFullYear());
                    if (date < minDate) minDate = date;
                    if (date > maxDate) maxDate = date;
                });

                setAvailableMonths(Array.from(months).sort((a, b) => a - b));
                setAvailableYears(Array.from(years).sort((a, b) => a - b));
                setMinDate(minDate);
                setMaxDate(maxDate);
                setNoDataAvailable(false);
            } else {
                setNoDataAvailable(true);
            }
        } catch (error) {
            console.error('Erro ao buscar datas disponíveis:', error);
            setError('Erro ao carregar datas disponíveis');
            setNoDataAvailable(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReportTypeChange = (event) => setReportType(event.target.value);
    const handlePeriodChange = (event) => {
        const selectedPeriod = event.target.value;
        setPeriod(selectedPeriod);
        
        if (selectedPeriod === 'monthly') {
            setSelectedMonth('');
            setSelectedYear('');
        } else if (selectedPeriod === 'yearly') {
            setSelectedYear('');
        }
    };

    const handleMonthChange = (event) => setSelectedMonth(event.target.value);
    const handleYearChange = (event) => setSelectedYear(event.target.value);
    const handleReportFormatChange = (event) => setReportFormat(event.target.value);

    const generatePdfHtml = (data, reportType, startDate, endDate) => {
        let tableContent = '';
        let totalItems = 0;

        if (Array.isArray(data)) {
            totalItems = data.length;
            if (data.length > 0 && typeof data[0] === 'object') {
                const headers = Object.keys(data[0]);
                tableContent = `
                    <thead>
                        <tr>${headers.map(key => `<th>${key}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>${headers.map(key => `<td>${row[key]}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                `;
            }
        } else if (typeof data === 'object') {
            const entries = Object.entries(data);
            totalItems = entries.length;
            tableContent = `
                <thead>
                    <tr><th>Chave</th><th>Valor</th></tr>
                </thead>
                <tbody>
                    ${entries.map(([key, value]) => `
                        <tr><td>${key}</td><td>${value}</td></tr>
                    `).join('')}
                </tbody>
            `;
        }

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório ${reportType}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #2c3e50; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .summary { margin-top: 30px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Relatório de ${reportType}</h1>
                    <p>Período: ${startDate} - ${endDate}</p>
                    <table>
                        ${tableContent}
                    </table>
                    <div class="summary">
                        <p>Total de itens: ${totalItems}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleExportReport = async () => {
        let reportStartDate, reportEndDate;

        if (period === 'monthly') {
            reportStartDate = new Date(selectedYear, selectedMonth - 1, 1);
            reportEndDate = new Date(selectedYear, selectedMonth, 0);
        } else if (period === 'yearly') {
            reportStartDate = new Date(selectedYear, 0, 1);
            reportEndDate = new Date(selectedYear, 11, 31);
        } else {
            reportStartDate = startDate;
            reportEndDate = endDate;
        }

        if (!reportStartDate || !reportEndDate) {
            setError('Por favor, selecione um período válido.');
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reports`, {
                params: {
                    reportType,
                    startDate: reportStartDate.toISOString(),
                    endDate: reportEndDate.toISOString(),
                    format: reportFormat
                },
                responseType: reportFormat === 'excel' ? 'blob' : 'json'
            });

            if (reportFormat === 'pdf') {
                const pdfHtml = generatePdfHtml(
                    response.data,
                    reportType,
                    reportStartDate.toLocaleDateString(),
                    reportEndDate.toLocaleDateString()
                );
                const pdfBlob = new Blob([pdfHtml], { type: 'text/html' });
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${reportType}_report.html`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${reportType}_report.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            setSuccessMessage('Relatório exportado com sucesso!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            setError('Erro ao exportar relatório. Por favor, tente novamente.');
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (noDataAvailable) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info">
                    Não há dados disponíveis para gerar relatórios. Por favor, realize algumas vendas primeiro.
                </Alert>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
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
                                    <MenuItem value="custom">Personalizado</MenuItem>
                                    <MenuItem value="monthly">Mensal</MenuItem>
                                    <MenuItem value="yearly">Anual</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {period === 'monthly' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Mês</InputLabel>
                                        <Select value={selectedMonth} label="Mês" onChange={handleMonthChange}>
                                            {availableMonths.map((month) => (
                                                <MenuItem key={month} value={month}>
                                                    {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Ano</InputLabel>
                                        <Select value={selectedYear} label="Ano" onChange={handleYearChange}>
                                            {availableYears.map((year) => (
                                                <MenuItem key={year} value={year}>{year}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </>
                        )}
                        {period === 'yearly' && (
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Ano</InputLabel>
                                    <Select value={selectedYear} label="Ano" onChange={handleYearChange}>
                                        {availableYears.map((year) => (
                                            <MenuItem key={year} value={year}>{year}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        {period === 'custom' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Data Inicial"
                                        value={startDate}
                                        onChange={setStartDate}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        format="dd/MM/yyyy"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Data Final"
                                        value={endDate}
                                        onChange={setEndDate}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        format="dd/MM/yyyy"
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Formato do Relatório</InputLabel>
                                <Select value={reportFormat} label="Formato do Relatório" onChange={handleReportFormatChange}>
                                    <MenuItem value="excel">Excel</MenuItem>
                                    <MenuItem value="pdf">PDF</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<CloudDownloadIcon />}
                                onClick={handleExportReport}
                                disabled={!reportType || (period === 'custom' && (!startDate || !endDate)) || 
                                          (period === 'monthly' && (!selectedMonth || !selectedYear)) ||
                                          (period === 'yearly' && !selectedYear)}
                                fullWidth
                            >
                                Exportar Relatório ({reportFormat.toUpperCase()})
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                {successMessage && <Typography color="success" sx={{ mt: 2 }}>{successMessage}</Typography>}
            </Box>
        </LocalizationProvider>
    );
};

export default ReportsPage;