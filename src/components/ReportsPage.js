import React, { useState } from 'react';
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
    useTheme
} from '@mui/material';
import { CloudDownload as CloudDownloadIcon } from '@mui/icons-material';

const ReportsPage = () => {
    const [reportType, setReportType] = useState('');
    const [period, setPeriod] = useState('');

    const handleReportTypeChange = (event) => {
        setReportType(event.target.value);
    };

    const handlePeriodChange = (event) => {
        setPeriod(event.target.value);
    };

    const handleExportReport = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/reports/export`, {
                params: { type: reportType, period: period },
                responseType: 'blob', // Important for file download
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportType}_${period}_report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            // Adicione aqui uma notificação de erro para o usuário
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
                            <Select
                                value={reportType}
                                label="Tipo de Relatório"
                                onChange={handleReportTypeChange}
                            >
                                <MenuItem value="sales">Vendas</MenuItem>
                                <MenuItem value="inventory">Estoque</MenuItem>
                                <MenuItem value="financial">Financeiro</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Período</InputLabel>
                            <Select
                                value={period}
                                label="Período"
                                onChange={handlePeriodChange}
                            >
                                <MenuItem value="weekly">Semanal</MenuItem>
                                <MenuItem value="monthly">Mensal</MenuItem>
                                <MenuItem value="yearly">Anual</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
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
        </Box>
    );
};

export default ReportsPage;
