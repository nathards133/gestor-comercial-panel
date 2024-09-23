import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    useMediaQuery,
    useTheme
} from '@mui/material';

const SalesPage = () => {
    const [sales, setSales] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [stats, setStats] = useState({ productStats: [], totalSales: {} });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchSales();
    }, [tabValue]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchSales = async () => {
        try {
            const period = ['day', 'week', 'year'][tabValue];
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/${period}`);
            setSales(response.data);
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/stats`);
            setStats(response.data);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
                Vendas
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                        <CardContent>
                            <Typography variant={isMobile ? "subtitle1" : "h6"}>Total de Vendas</Typography>
                            <Typography variant={isMobile ? "h5" : "h4"}>R$ {stats.totalSales.totalValue?.toFixed(2) || '0.00'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                        <CardContent>
                            <Typography variant="h6">Número de Vendas</Typography>
                            <Typography variant="h4">{stats.totalSales.count || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#fff3e0' }}>
                        <CardContent>
                            <Typography variant="h6">Produto Mais Vendido</Typography>
                            <Typography variant="h4">{stats.productStats[0]?.name || 'N/A'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                centered 
                variant={isMobile ? "fullWidth" : "standard"}
            >
                <Tab label="Dia" />
                <Tab label="Semana" />
                <Tab label="Ano" />
            </Tabs>

            <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
                <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Produtos</TableCell>
                            <TableCell align="right">Valor Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sales.map((sale) => (
                            <TableRow key={sale._id}>
                                <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                                <TableCell>
                                    {sale.items.map(item => (
                                        <div key={item._id}>
                                            {item.product.name} - {item.quantity}x R$ {item.price.toFixed(2)}
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell align="right">R$ {sale.totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mt: 4, mb: 2 }}>Estatísticas de Produtos</Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Produto</TableCell>
                            <TableCell align="right">Quantidade Vendida</TableCell>
                            <TableCell align="right">Valor Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.productStats.map((stat) => (
                            <TableRow key={stat._id}>
                                <TableCell>{stat.name}</TableCell>
                                <TableCell align="right">{stat.totalQuantity}</TableCell>
                                <TableCell align="right">R$ {stat.totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SalesPage;
