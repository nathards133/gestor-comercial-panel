import React, { useState } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, Grid, Paper,
    useMediaQuery, useTheme, TextField, CircularProgress, Alert
} from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

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
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDates, setIsFetchingDates] = useState(false);
    const [reportFormat, setReportFormat] = useState('excel');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const fetchAvailableDates = async (reportType) => {
        setIsFetchingDates(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reports/available-dates?reportType=${reportType}`);
            setAvailableMonths(response.data.months);
            setAvailableYears(response.data.years);
            setMinDate(new Date(response.data.minDate));
            setMaxDate(new Date(response.data.maxDate));
        } catch (error) {
            console.error('Erro ao buscar datas disponíveis:', error);
            setError('Erro ao buscar datas disponíveis. Por favor, tente novamente.');
        } finally {
            setIsFetchingDates(false);
        }
    };

    const handleReportTypeChange = (event) => {
        const selectedType = event.target.value;
        setReportType(selectedType);
        setAvailableMonths([]);
        setAvailableYears([]);
        setPeriod('');
        setSelectedMonth('');
        setSelectedYear('');

        if (selectedType === 'sales' || selectedType === 'financial') {
            fetchAvailableDates(selectedType);
        }
    };

    const handlePeriodChange = (event) => {
        const selectedPeriod = event.target.value;
        setPeriod(selectedPeriod);
        setSelectedMonth('');
        setSelectedYear('');
        setStartDate(null);
        setEndDate(null);
    };

    const handleMonthChange = (event) => setSelectedMonth(event.target.value);
    const handleYearChange = (event) => setSelectedYear(event.target.value);
    const handleReportFormatChange = (event) => setReportFormat(event.target.value);

    const handleExportReport = async () => {
        if (!reportType) {
            setError('Por favor, selecione um tipo de relatório.');
            return;
        }

        let reportStartDate, reportEndDate;

        if (reportType === 'inventory') {
            // Relatório de inventário não precisa de datas
            reportStartDate = null;
            reportEndDate = null;
        } else {
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

            // Verifique se as datas são válidas antes de prosseguir
            if (!reportStartDate || !reportEndDate || isNaN(reportStartDate.getTime()) || isNaN(reportEndDate.getTime())) {
                setError('Por favor, selecione um período válido.');
                return;
            }
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reports`, {
                params: {
                    reportType,
                    startDate: reportStartDate ? reportStartDate.toISOString() : null,
                    endDate: reportEndDate ? reportEndDate.toISOString() : null,
                    format: reportFormat
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}_report.${reportFormat}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSuccessMessage('Relatório exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            setError('Erro ao exportar relatório. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

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
                                <Select value={period} label="Período" onChange={handlePeriodChange} disabled={!availableMonths.length}>
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
                                        <Select value={selectedMonth} label="Mês" onChange={handleMonthChange} disabled={isFetchingDates}>
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
                                        <Select value={selectedYear} label="Ano" onChange={handleYearChange} disabled={isFetchingDates}>
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
                                    <Select value={selectedYear} label="Ano" onChange={handleYearChange} disabled={isFetchingDates}>
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
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default ReportsPage;
