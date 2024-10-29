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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SalesPage = () => {
    const [sales, setSales] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [periodInfo, setPeriodInfo] = useState(null);
    const [stats, setStats] = useState(() => {
        const cachedStats = localStorage.getItem('salesStats');
        return cachedStats ? JSON.parse(cachedStats) : { sales: [], totalSales: 0 };
    });
    const [cachedData, setCachedData] = useState({});
    const [lastStatsFetch, setLastStatsFetch] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });
    const [notifications, setNotifications] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true);  //ativa e desativa o modal de senha
    const [isContentVisible, setIsContentVisible] = useState(false); // ativa e desativa o conteudo do painel
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentDate, setCurrentDate] = useState(new Date()); 

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [currentAccount, setCurrentAccount] = useState({
        type: '',
        supplier: '',
        product: '',
        quantity: '',
        totalValue: '',
        dueDate: null,
        dueDay: '',
        description: ''
    });

    const [accountsStats, setAccountsStats] = useState({
        totalExpenses: 0,
        totalPendingExpenses: 0,
        totalPaidExpenses: 0,
        totalPendingExpensesCount: 0
    });

    const [totalSalesByPaymentMethod, setTotalSalesByPaymentMethod] = useState({});

    const calculateSalesByPaymentMethod = useCallback((salesData) => {
        const methodTotals = salesData.reduce((acc, sale) => {
            const method = sale.paymentMethod || 'Não especificado';
            acc[method] = (acc[method] || 0) + (sale.totalValue || 0);
            return acc;
        }, {});
        setTotalSalesByPaymentMethod(methodTotals);
    }, []);

    const renderFinancialCard = (title, value, isPositive) => (
        <Card sx={{ mb: 2, bgcolor: isPositive ? 'success.light' : 'error.light' }}>
            <CardContent>
                <Typography variant="h6" component="div">
                    {title}
                </Typography>
                <Typography variant="h4" component="div" color={isPositive ? 'success.dark' : 'error.dark'}>
                    R$ {(value || 0).toFixed(2)}
                </Typography>
            </CardContent>
        </Card>
    );

    const fetchSales = useCallback(async (period) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/sales`, {
                params: { 
                    period,
                    page: page + 1,
                    limit: rowsPerPage
                }
            });
            
            if (response.data) {
                setSales(response.data.sales || []);
                setPeriodInfo(response.data.periodInfo || null);
                calculateSalesByPaymentMethod(response.data.sales || []);
                
                setPagination({
                    currentPage: response.data.pagination?.currentPage || 1,
                    totalPages: response.data.pagination?.totalPages || 1,
                    totalItems: response.data.pagination?.totalItems || response.data.sales?.length || 0
                });
            }
            
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
            setError('Falha ao carregar as vendas. Por favor, tente novamente.');
            setSales([]);
            setTotalSalesByPaymentMethod({});
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalItems: 0
            });
        } finally {
            setLoading(false);
        }
    }, [calculateSalesByPaymentMethod, page, rowsPerPage]);

    const fetchAccountsStats = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/accounts-payable/monthly-stats`);
            setAccountsStats({
                totalExpenses: response.data.totalDue,
                totalPendingExpenses: response.data.totalPending,
                totalPaidExpenses: response.data.totalPaid,
                totalPendingExpensesCount: response.data.pendingCount || 0
            });
        } catch (error) {
            console.error('Erro ao buscar estatísticas de contas:', error);
        }
    }, []);

    useEffect(() => {
        // Não fazer nada aqui, as requisições serão feitas após a validação da senha
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

    // useEffect(() => {
    //     fetchStats();
    //     const interval = setInterval(fetchStats, 5 * 60 * 1000);
    //     return () => clearInterval(interval);
    // }, [fetchStats]);

    useEffect(() => {
        // Função para buscar notificações
        // const fetchNotifications = async () => {
        //     try {
        //         const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/notifications`);
        //         setNotifications(response.data);
        //     } catch (error) {
        //         console.error('Erro ao buscar notificações:', error);
        //     }
        // };

        // fetchNotifications();
        // Atualiza as notificaões a cada 5 minutos
        // const interval = setInterval(fetchNotifications, 5 * 60 * 1000);

        // return () => clearInterval(interval);
    }, []);

    const totalSalesValue = useMemo(() => {
        return sales.reduce((total, sale) => total + (sale.totalValue || 0), 0);
    }, [sales]);

    const totalSalesCount = useMemo(() => {
        return sales.length;
    }, [sales]);

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
            const response = await axios.post(`${API_URL}/api/verify-password`, { password });
            if (response.data.isValid) {
                setIsPasswordModalOpen(false);
                setIsContentVisible(true);
                
                // Iniciar as requisições após a validação da senha
                try {
                    setLoading(true);
                    await Promise.all([
                        fetchSales('day'),
                        fetchAccountsStats()
                    ]);
                } catch (error) {
                    console.error('Erro ao carregar dados iniciais:', error);
                    setError('Falha ao carregar os dados. Por favor, tente novamente.');
                } finally {
                    setLoading(false);
                }
            } else {
                setSnackbar({
                    open: true,
                    message: 'Senha incorreta',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            setSnackbar({
                open: true,
                message: 'Erro ao verificar senha',
                severity: 'error'
            });
        }
    };

    const handlePasswordModalClose = () => {
        navigate('/');
    };

    const renderSkeleton = () => (
        <Container>
            <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2, mx: 'auto' }} /> {/* Título */}
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 3 }} /> {/* Alerta */}
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[1, 2, 3].map((item) => (
                    <Grid item xs={12} sm={4} key={item}>
                        <Skeleton variant="rectangular" width="100%" height={100} />
                    </Grid>
                ))}
            </Grid>
            
            <Skeleton variant="rectangular" width="100%" height={48} sx={{ mb: 2 }} /> {/* Tabs */}
            
            <Skeleton variant="text" width="40%" sx={{ mb: 2, mx: 'auto' }} /> {/* Período */}
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {[1, 2, 3, 4].map((item) => (
                                <TableCell key={item}>
                                    <Skeleton variant="text" width="100%" />
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((row) => (
                            <TableRow key={row}>
                                {[1, 2, 3, 4].map((cell) => (
                                    <TableCell key={cell}>
                                        <Skeleton variant="text" width="100%" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Skeleton variant="rectangular" width={120} height={36} /> {/* Paginação */}
            </Box>
        </Container>
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        const periods = ['day', 'week', 'month'];
        fetchSales(periods[tabValue]);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
        const periods = ['day', 'week', 'month'];
        fetchSales(periods[tabValue]);
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

    const calculateNetProfit = useMemo(() => {
        const totalNetProfit = totalSalesValue - accountsStats.totalExpenses;
        const totalProfitMargin = totalSalesValue > 0 
            ? (totalNetProfit / totalSalesValue) * 100 
            : 0;
        return { totalNetProfit, totalProfitMargin };
    }, [totalSalesValue, accountsStats.totalExpenses]);

    return (
        <Box sx={{ p: 2 }}>
            <PasswordModal
                open={isPasswordModalOpen}
                onClose={handlePasswordModalClose}
                onSubmit={handlePasswordSubmit}
                title="Digite a senha para acessar as vendas"
                alert="Somente administradores podem acessar esta página."
            />
            
            {isPasswordModalOpen ? (
                renderSkeleton()
            ) : (
                <div style={{ 
                    display: isContentVisible ? 'block' : 'none',
                    opacity: isContentVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out'
                }}>
                    {loading ? (
                        <CircularProgress />
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : (
                        // Conteúdo principal
                        <>
                            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom align="center">
                                Dashboard de Vendas
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

                            {/* Novos cards de resumo financeiro */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                                        <CardContent>
                                            <Typography variant={isMobile ? "subtitle1" : "h6"}>
                                                Vendas Brutas (Mês Atual)
                                            </Typography>
                                            <Typography variant={isMobile ? "h5" : "h4"}>
                                                R$ {totalSalesValue.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {totalSalesCount} transações
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
                                        <CardContent>
                                            <Typography variant={isMobile ? "subtitle1" : "h6"}>
                                                Contas a Pagar
                                            </Typography>
                                            <Typography variant={isMobile ? "h5" : "h4"}>
                                                R$ {accountsStats.totalExpenses.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Pendente: R$ {accountsStats.totalPendingExpenses.toFixed(2)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Card sx={{ 
                                        bgcolor: calculateNetProfit.totalNetProfit >= 0 ? '#e3f2fd' : '#ffebee',
                                        height: '100%' 
                                    }}>
                                        <CardContent>
                                            <Typography variant={isMobile ? "subtitle1" : "h6"}>
                                                Lucro Líquido
                                            </Typography>
                                            <Typography 
                                                variant={isMobile ? "h5" : "h4"}
                                                color={calculateNetProfit.totalNetProfit >= 0 ? 'success.main' : 'error.main'}
                                            >
                                                R$ {calculateNetProfit.totalNetProfit.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Margem: {calculateNetProfit.totalProfitMargin.toFixed(1)}%
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Adicione um novo card para detalhes de pagamento */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12}>
                                    <Card sx={{ bgcolor: '#fafafa' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Status das Contas
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total a Pagar
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        R$ {accountsStats.totalExpenses.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Pendente
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        R$ {accountsStats.totalPendingExpenses.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Pago
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        R$ {accountsStats.totalPaidExpenses.toFixed(2)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Contas Pendentes
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {accountsStats.totalPendingExpensesCount}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Adicionar um card extra para detalhes de pagamento */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12}>
                                    <Card sx={{ bgcolor: '#fafafa' }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Vendas por Método de Pagamento
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {Object.entries(totalSalesByPaymentMethod).map(([method, value]) => (
                                                    <Grid item xs={6} sm={3} key={method}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {method}
                                                        </Typography>
                                                        <Typography variant="h6">
                                                            R$ {value.toFixed(2)}
                                                        </Typography>
                                                    </Grid>
                                                ))}
                                                {Object.keys(totalSalesByPaymentMethod).length === 0 && (
                                                    <Grid item xs={12}>
                                                        <Typography variant="body2" color="text.secondary" align="center">
                                                            Nenhuma venda registrada no período
                                                        </Typography>
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Tabs value={tabValue} onChange={handleTabChange} centered>
                                <Tab label="Dia" />
                                <Tab label="Semana" />
                                <Tab label="Mês" />
                            </Tabs>

                            {loading ? (
                                <CircularProgress />
                            ) : error ? (
                                <Alert severity="error">{error}</Alert>
                            ) : (
                                <>
                                    {periodInfo && (
                                        <Typography variant="subtitle1" align="center" sx={{ mt: 2, mb: 2 }}>
                                            {periodInfo.label}
                                        </Typography>
                                    )}
                                    {sales.length === 0 ? (
                                        <Alert severity="info">Nenhuma venda encontrada para este período.</Alert>
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
                                                {sales.map((sale) => (
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
                                            count={pagination.totalItems || 0}
                                            page={Math.min(page, Math.max(0, pagination.totalPages - 1))}
                                            onPageChange={handleChangePage}
                                            rowsPerPage={rowsPerPage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                            rowsPerPageOptions={[5, 10, 25, 50]}
                                            labelRowsPerPage="Itens por página"
                                            labelDisplayedRows={({ from, to, count }) => 
                                                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                                            }
                                        />
                                    </TableContainer>
                                    )}
                                </>
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
                    )}
                </div>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};


export default SalesPage;
