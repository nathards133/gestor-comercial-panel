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
  useMediaQuery,
  useTheme,
  ListItemButton,
  CssBaseline,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Home, 
  ShoppingCart, 
  Assessment, 
  Menu as MenuIcon, 
  PointOfSale, 
  Store, 
  ChevronLeft,
  ChevronRight,
  Settings,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  AccountCircle,
  ExitToApp,
  AttachMoney
} from '@mui/icons-material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Dialog, DialogTitle, DialogContent } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentNotificationList from './PaymentNotificationList';

const menuItems = [
  { text: 'Caixa', icon: <PointOfSale />, path: '/' },
  { text: 'Produtos', icon: <ShoppingCart />, path: '/products' },
  { text: 'Vendas', icon: <AttachMoney />, path: '/sales' },
  { text: 'Relatórios', icon: <Assessment />, path: '/reports' },
  { text: 'Fornecedores', icon: <Store />, path: '/suppliers' },
  { text: 'Integrações', icon: <Settings />, path: '/integrations' },
];

const Layout = ({ toggleTheme, isDarkMode }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    if (!isMobile) {
      setOpen(!open);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setNotificationDialogOpen(true);
    setNotificationCount(0);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const drawerWidth = isMobile ? 60 : (open ? 240 : 60);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Bem vindo, {user?.company}
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={notificationCount} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              style: {
                marginTop: '8px', // Adiciona um pequeno espaço entre a barra de ferramentas e o menu
              },
            }}
          >
            <MenuItem onClick={handleClose}>Perfil</MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
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
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          height: 'calc(100% - 64px)'
        }}>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.path}
                component={Link} 
                to={item.path}
                disablePadding
              >
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open && !isMobile ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open && !isMobile ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ opacity: open && !isMobile ? 1 : 0 }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {!isMobile && (
            <Box>
              <Divider />
              <IconButton onClick={handleDrawerToggle} sx={{ width: '100%', py: 1 }}>
                {open ? <ChevronLeft /> : <ChevronRight />}
              </IconButton>
            </Box>
          )}
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