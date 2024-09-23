import React, { useState, useEffect, useCallback } from 'react';
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
    useTheme,
    Alert,
    Button,
    CircularProgress
} from '@mui/material';

const SalesPage = () => {
    const [sales, setSales] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [stats, setStats] = useState({ productStats: [], totalSales: {} });
    const [cachedData, setCachedData] = useState({});
    const [lastStatsFetch, setLastStatsFetch] = useState(null);
    const [periodInfo, setPeriodInfo] = useState(null);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchSales = useCallback(async (period, page = 1) => {
        const cacheKey = `${period}_${page}`;
        if (cachedData[cacheKey]) {
            setSales(cachedData[cacheKey].sales || []);
            setPeriodInfo(cachedData[cacheKey].period);
            setPagination(cachedData[cacheKey].pagination || { currentPage: page, totalPages: page });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/${period}?page=${page}`);
            console.log('API Response:', response.data); // Log da resposta da API
            const newSales = Array.isArray(response.data.sales) ? response.data.sales : [];
            setSales(newSales); // Alterado para substituir as vendas em vez de adicionar
            setPeriodInfo(response.data.period || null);
            setPagination(response.data.pagination || { currentPage: page, totalPages: page });
            setCachedData(prev => ({ 
                ...prev, 
                [cacheKey]: { 
                    sales: newSales, 
                    period: response.data.period || null,
                    pagination: response.data.pagination || { currentPage: page, totalPages: page }
                } 
            }));
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
        } finally {
            setLoading(false);
        }
    }, [cachedData]);

    const fetchStats = useCallback(async () => {
        const now = new Date();
        if (lastStatsFetch && (now - lastStatsFetch) < 5 * 60 * 1000) {
            // Se a última busca foi há menos de 5 minutos, não busca novamente
            return;
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/stats/daily`);
            setStats(response.data);
            setLastStatsFetch(now);
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    }, [lastStatsFetch]);

    useEffect(() => {
        const periods = ['day', 'week', 'month'];
        setSales([]); // Limpa as vendas antes de buscar novas
        fetchSales(periods[tabValue], 1); // Sempre busca a primeira página ao mudar de período
    }, [tabValue, fetchSales]);

    useEffect(() => {
        fetchStats();
        // Configura um intervalo para buscar as estatísticas a cada 5 minutos
        const interval = setInterval(fetchStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleLoadMore = () => {
        const periods = ['day', 'week', 'month'];
        fetchSales(periods[tabValue], (pagination?.currentPage || 0) + 1);
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
                            <Typography variant={isMobile ? "h5" : "h4"}>R$ {stats.totalSales?.totalValue?.toFixed(2) || '0.00'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                        <CardContent>
                            <Typography variant="h6">Número de Vendas</Typography>
                            <Typography variant="h4">{stats.totalSales?.count || 0}</Typography>
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
                {!periodInfo?.isNewUser && <Tab label="Últimos 3 Meses" />}
            </Tabs>

            {periodInfo && periodInfo.isNewUser && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Você é um novo usuário! Os dados mostrados são desde o início do seu uso do sistema.
                </Alert>
            )}

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

            {pagination && pagination.currentPage < pagination.totalPages && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                        variant="contained" 
                        onClick={handleLoadMore}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Carregar Mais'}
                    </Button>
                </Box>
            )}

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
