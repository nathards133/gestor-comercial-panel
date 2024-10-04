import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    CircularProgress,
    Skeleton,
    Container
} from '@mui/material';
import WarningMessage from './WarningMessage';
import PaymentNotificationList from './PaymentNotificationList';
import PasswordModal from './PasswordModal';
import { useNavigate } from 'react-router-dom';

const SalesPage = () => {
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState(() => {
        const cachedStats = localStorage.getItem('salesStats');
        return cachedStats ? JSON.parse(cachedStats) : { sales: [], totalSales: 0 };
    });
    const [tabValue, setTabValue] = useState(0);
    const [cachedData, setCachedData] = useState({});
    const [lastStatsFetch, setLastStatsFetch] = useState(null);
    const [periodInfo, setPeriodInfo] = useState(null);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true); 
    const [isContentVisible, setIsContentVisible] = useState(true); // ativa e desativa o conteudo do painel
    const navigate = useNavigate();

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
            console.log('API Response:', response.data);
            const newSales = Array.isArray(response.data.sales) ? response.data.sales : [];
            setSales(prevSales => page === 1 ? newSales : [...prevSales, ...newSales]);
            setPeriodInfo(response.data.period || null);
            setPagination({
                currentPage: response.data.currentPage || page,
                totalPages: response.data.totalPages || page
            });
            setCachedData(prev => ({ 
                ...prev, 
                [cacheKey]: { 
                    sales: newSales, 
                    period: response.data.period || null,
                    pagination: response.data.pagination || { currentPage: page, totalPages: page },
                    isNewUser: response.data.isNewUser
                } 
            }));
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
            setSales([]);
        } finally {
            setLoading(false);
        }
    }, [cachedData]);

    const fetchStats = useCallback(async () => {
        const now = new Date();
        const lastFetch = localStorage.getItem('lastStatsFetch');
        if (lastFetch && (now - new Date(lastFetch)) < 5 * 60 * 1000) {
            return; // Se a última busca foi há menos de 5 minutos, não busca novamente
        }

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/stats/daily`);
            console.log('Estatísticas recebidas:', response.data);
            setStats(response.data);
            setSales(response.data.sales || []);
            localStorage.setItem('salesStats', JSON.stringify(response.data));
            localStorage.setItem('lastStatsFetch', now.toISOString());
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
        }
    }, []);

    useEffect(() => {
        const periods = ['day', 'week', 'month'];
        setSales([]); // Limpa as vendas antes de buscar novas
        fetchSales(periods[tabValue], 1); // Sempre busca a primeira página ao mudar de período
    }, [tabValue, fetchSales]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    useEffect(() => {
        // Função para buscar notificações
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/notifications`);
                setNotifications(response.data);
            } catch (error) {
                console.error('Erro ao buscar notificações:', error);
            }
        };

        fetchNotifications();
        // Atualiza as notificações a cada 5 minutos
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const totalSalesValue = useMemo(() => {
        return sales.reduce((total, sale) => total + (sale.totalValue || 0), 0);
    }, [sales]);

    const totalSalesCount = useMemo(() => {
        return stats.totalSales || 0;
    }, [stats.totalSales]);

    const topSellingProduct = useMemo(() => {
        const productCounts = sales.flatMap(sale => {
            if (!sale.items || sale.items.length === 0) {
                return [{ product: { name: 'Venda Direta' }, quantity: 1 }];
            }
            return sale.items.map(item => ({
                product: item.product || { name: 'Venda Direta' },
                quantity: item.quantity || 1
            }));
        }).reduce((counts, item) => {
            const productName = item.product.name || 'Venda Direta';
            counts[productName] = (counts[productName] || 0) + item.quantity;
            return counts;
        }, {});
        const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
        return topProduct ? topProduct[0] : 'N/A';
    }, [sales]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleLoadMore = () => {
        const periods = ['day', 'week', 'month'];
        fetchSales(periods[tabValue], (pagination?.currentPage || 0) + 1);
    };

    const renderPeriodWarning = () => {
        if (sales.length === 0) {
            const periods = ['dia', 'semana', 'mês'];
            return (
                <WarningMessage 
                    title={`Dados de ${periods[tabValue]} Indisponíveis`}
                    message={`Não há vendas registradas no último ${periods[tabValue]}.`}
                    severity="info"
                />
            );
        }
        return null;
    };

    const renderNewUserWarning = () => {
        if (periodInfo && periodInfo.isNewUser) {
            if (tabValue === 2) { // Mês
                return (
                    <WarningMessage 
                        title="Novo Usuário - Dados Mensais"
                        message="Como você é um novo usuário, os dados mensais mostram todas as suas vendas desde o início do uso do sistema."
                        severity="info"
                    />
                );
            }
        }
        return null;
    };

    const renderSaleItems = (sale) => {
        if (sale.items && sale.items.length > 0) {
            return sale.items.map(item => (
                <div key={item._id || Math.random()}>
                    {item.product?.name || 'Venda Direta'} - {item.quantity || 1}x R$ {item.price?.toFixed(2) || '0.00'}
                </div>
            ));
        } else {
            return <div>Venda Direta - 1x R$ {sale.totalValue?.toFixed(2) || '0.00'}</div>;
        }
    };

    const handlePasswordSubmit = async (password) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/verify-password`, { password });
            if (response.data.isValid) {
                setIsPasswordModalOpen(false);
                setIsContentVisible(true);  // Adicione esta linha
            } else {
                alert('Senha incorreta');
            }
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            alert('Erro ao verificar senha');
        }
    };

    const handlePasswordModalClose = () => {
        navigate('/');
    };

    const renderSkeleton = () => (
        <Container>
            <Skeleton variant="rectangular" width="100%" height={118} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={240} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={360} />
        </Container>
    );

    return (
        <Box sx={{ p: 2 }}>
{/*             
            <PasswordModal
                open={isPasswordModalOpen}
                onClose={handlePasswordModalClose}
                onSubmit={handlePasswordSubmit}
                title="Digite a senha para acessar as vendas"
            />
             */}
            {isContentVisible ? (
                <>
                    <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
                        Vendas
                    </Typography>

                    <PaymentNotificationList notifications={notifications} />

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                                <CardContent>
                                    <Typography variant={isMobile ? "subtitle1" : "h6"}>Total de Vendas</Typography>
                                    <Typography variant={isMobile ? "h5" : "h4"}>
                                        R$ {totalSalesValue.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: '#e8f5e9' }}>
                                <CardContent>
                                    <Typography variant="h6">Número de Vendas</Typography>
                                    <Typography variant="h4">
                                        {totalSalesCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent>
                                    <Typography variant="h6">Produto Mais Vendido</Typography>
                                    <Typography variant="h4">
                                        {topSellingProduct}
                                    </Typography>
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
                        <Tab label="Mês" />
                    </Tabs>

                    {renderPeriodWarning()}
                    {renderNewUserWarning()}

                    <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
                        <Table size={isMobile ? "small" : "medium"}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Produtos</TableCell>
                                    <TableCell align="right">Valor Total</TableCell>
                                    <TableCell>Método de Pagamento</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sales && sales.length > 0 ? (
                                    sales.map((sale) => (
                                        <TableRow key={sale._id}>
                                            <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                                            <TableCell>{renderSaleItems(sale)}</TableCell>
                                            <TableCell align="right">R$ {sale.totalValue?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell>{sale.paymentMethod || 'Não especificado'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">Nenhuma venda encontrada</TableCell>
                                    </TableRow>
                                )}
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
                            {stats.productStats && stats.productStats.length > 0 ? (
                                stats.productStats.map((stat) => (
                                    <TableRow key={stat._id}>
                                        <TableCell>{stat.name}</TableCell>
                                        <TableCell align="right">{stat.totalQuantity}</TableCell>
                                        <TableCell align="right">R$ {stat.totalValue?.toFixed(2) || '0.00'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">Nenhuma estatística de produto disponível</TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            ) : (
                renderSkeleton()
            )}
        </Box>
    );
};


export default SalesPage;