import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { startOfDay, startOfWeek, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
    TablePagination,
    Paper,
    useMediaQuery,
    useTheme,
    Alert,
    Button,
    CircularProgress,
    Skeleton,
    Container,
    IconButton,
    Snackbar
} from '@mui/material';
import WarningMessage from './WarningMessage';
import PaymentNotificationList from './PaymentNotificationList';
import PasswordModal from './PasswordModal';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

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
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true); 
    const [isContentVisible, setIsContentVisible] = useState(false); // ativa e desativa o conteudo do painel
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentDate, setCurrentDate] = useState(new Date()); 

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const fetchSales = useCallback(async (period) => {
        setLoading(true);
        try {
            let startDate, endDate;
            const now = new Date();

            switch (period) {
                case 'day':
                    startDate = startOfDay(now);
                    endDate = now;
                    break;
                case 'week':
                    startDate = startOfWeek(now, { weekStartsOn: 1 }); // 1 representa segunda-feira
                    endDate = now;
                    break;
                case 'month':
                    const lastMonth = subMonths(now, 1);
                    startDate = startOfMonth(lastMonth);
                    endDate = endOfMonth(lastMonth);
                    break;
                default:
                    throw new Error('Período inválido');
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales`, {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    period: period
                }
            });

            const newSales = Array.isArray(response.data.sales) ? response.data.sales : [];
            setSales(newSales);
            setPeriodInfo({
                start: startDate,
                end: endDate,
                period: period
            });

            // Buscar estatísticas de produtos para o período
            const statsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/sales/stats`, {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            });

            setStats(statsResponse.data);

            if (newSales.length === 0 && period === 'month') {
                setSnackbar({
                    open: true,
                    message: `Não foram feitas vendas em ${format(startDate, 'MMMM', { locale: ptBR })}`,
                    severity: 'info'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
            setSales([]);
            setStats({ productStats: [] });
        } finally {
            setLoading(false);
        }
    }, []);

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
        fetchSales('day'); // Inicialmente, carrega as vendas do dia
    }, [fetchSales]);

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
        const periods = ['day', 'week', 'month'];
        fetchSales(periods[newValue]);
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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedSales = useMemo(() => {
        return sales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sales, page, rowsPerPage]);

    const renderMobileSaleCard = (sale) => (
        <Card key={sale._id} sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                    {new Date(sale.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">{renderSaleItems(sale)}</Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                    Total: R$ {sale.totalValue?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Pagamento: {sale.paymentMethod || 'Não especificado'}
                </Typography>
            </CardContent>
        </Card>
    );

    const renderMobilePagination = () => (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2">
                {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, sales.length)} de ${sales.length}`}
            </Typography>
            <Box>
                <IconButton 
                    onClick={() => handleChangePage(null, page - 1)} 
                    disabled={page === 0}
                    size="small"
                >
                    <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                <IconButton 
                    onClick={() => handleChangePage(null, page + 1)} 
                    disabled={page >= Math.ceil(sales.length / rowsPerPage) - 1}
                    size="small"
                >
                    <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: 2 }}>
                        
            <PasswordModal
                open={isPasswordModalOpen}
                onClose={handlePasswordModalClose}
                onSubmit={handlePasswordSubmit}
                title="Digite a senha para acessar as vendas"
                alert="Somente administradores podem acessar esta página."
            />
            
            {isContentVisible ? (
                <>
                    <Typography variant={isMobile ? "h5" : "h4"} gutterBottom align="center">
                        Vendas
                    </Typography>

                    <Alert severity="info" align="center" sx={{ mb: 2 }}>
                    Esta página é destinada ao administrador do sistema, oferecendo uma visão geral do desempenho do seu negócio. Para garantir uma análise precisa e confiável, mantenha o sistema sempre atualizado. Assim, você poderá identificar oportunidades e aprimorar continuamente os resultados.
                    </Alert>

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

                    {periodInfo && (
                        <Typography variant="subtitle1" align="center" sx={{ mt: 2, mb: 2 }}>
                            {periodInfo.period === 'day' && 'Vendas de hoje'}
                            {periodInfo.period === 'week' && `Vendas desta semana (${format(periodInfo.start, 'dd/MM')} - ${format(periodInfo.end, 'dd/MM')})`}
                            {periodInfo.period === 'month' && `Vendas de ${format(periodInfo.start, 'MMMM', { locale: ptBR })}`}
                        </Typography>
                    )}

                    {renderPeriodWarning()}
                    {renderNewUserWarning()}

                    {isMobile ? (
                        <>
                            {paginatedSales.map(renderMobileSaleCard)}
                            {renderMobilePagination()}
                        </>
                    ) : (
                        <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
                            <Table size="medium">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Data</TableCell>
                                        <TableCell>Produtos</TableCell>
                                        <TableCell align="right">Valor Total</TableCell>
                                        <TableCell>Método de Pagamento</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedSales.map((sale) => (
                                        <TableRow key={sale._id}>
                                            <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                                            <TableCell>{renderSaleItems(sale)}</TableCell>
                                            <TableCell align="right">R$ {sale.totalValue?.toFixed(2) || '0.00'}</TableCell>
                                            <TableCell>{sale.paymentMethod || 'Não especificado'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={sales.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                labelRowsPerPage="Linhas por página:"
                            />
                        </TableContainer>
                    )}

                    {/* <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
                        Estatísticas de Produtos
                    </Typography> */}
                    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                        {/* <Table size={isMobile ? "small" : "medium"}>
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
                        </Table> */}
                    </TableContainer>
                </>
            ) : (
                renderSkeleton()
            )}
        </Box>
    );
};


export default SalesPage;