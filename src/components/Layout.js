import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Button,
  useMediaQuery,
  useTheme,
  ListItemButton
} from '@mui/material';
import { 
  Home, 
  ShoppingCart, 
  Payments, 
  Inventory, 
  Assessment, 
  Menu as MenuIcon, 
  PointOfSale, 
  Store, 
  ExitToApp,
  ChevronLeft,
  ChevronRight,
  Settings
} from '@mui/icons-material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Dialog, DialogTitle, DialogContent } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import PaymentNotificationList from './PaymentNotificationList';

const menuItems = [
  { text: 'Caixa', icon: <Home />, path: '/' },
  { text: 'Produtos', icon: <ShoppingCart />, path: '/products' },
  { text: 'Vendas', icon: <PointOfSale />, path: '/sales' },
  { text: 'Relatórios', icon: <Assessment />, path: '/reports' },
//   { text: 'Contas a Pagar', icon: <Payments />, path: '/contas-a-pagar' },
//   { text: 'Gestão de Estoque', icon: <Inventory />, path: '/stock' },
  { text: 'Fornecedores', icon: <Store />, path: '/suppliers' },
  { text: 'Integrações', icon: <Settings />, path: '/integrations' },
];

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/notifications`);
        setNotifications(response.data);
        setNotificationCount(response.data.length);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setNotificationDialogOpen(true);
    setNotificationCount(0); // Reseta o contador ao abrir as notificações
  };

  const drawerWidth = open ? 240 : 60;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Bem vindo, {user?.company} - {user?.businessType}
          </Typography>
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={notificationCount} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Button color="inherit" onClick={handleLogout} startIcon={<ExitToApp />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.path}  // Adicione esta linha
                component={Link} 
                to={item.path}
                sx={{ 
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ opacity: open ? 1 : 0 }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Box>
      </Drawer>
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)}>
        <DialogTitle>Notificações de Pagamento</DialogTitle>
        <DialogContent>
          <PaymentNotificationList notifications={notifications} />
        </DialogContent>
      </Dialog>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;