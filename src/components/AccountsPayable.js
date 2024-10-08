import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  useMediaQuery, useTheme
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AccountsPayable = () => {
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({
    supplier: '', product: '', quantity: '', totalValue: '', dueDate: null
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchAccounts();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/accounts-payable`);
      setAccounts(response.data);
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setCurrentAccount(prev => ({ ...prev, dueDate: date }));
  };

  const handleSubmit = async () => {
    try {
      if (currentAccount._id) {
        await axios.put(`${API_URL}/api/accounts-payable/${currentAccount._id}`, currentAccount);
      } else {
        await axios.post(`${API_URL}/api/accounts-payable`, currentAccount);
      }
      setOpenDialog(false);
      fetchAccounts();
    } catch (error) {
      console.error('Erro ao salvar conta a pagar:', error);
    }
  };

  const handleEdit = (account) => {
    setCurrentAccount(account);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
      try {
        await axios.delete(`${API_URL}/api/accounts-payable/${id}`);
        fetchAccounts();
      } catch (error) {
        console.error('Erro ao excluir conta a pagar:', error);
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom align="center">
          Contas a Pagar
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setCurrentAccount({
              supplier: '', product: '', quantity: '', totalValue: '', dueDate: null
            });
            setOpenDialog(true);
          }}
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
        >
          Adicionar Conta a Pagar
        </Button>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fornecedor</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell>Quantidade</TableCell>
                <TableCell>Valor Total</TableCell>
                <TableCell>Data de Vencimento</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell>{account.supplier.name}</TableCell>
                  <TableCell>{account.product.name}</TableCell>
                  <TableCell>{account.quantity}</TableCell>
                  <TableCell>R$ {account.totalValue.toFixed(2)}</TableCell>
                  <TableCell>{new Date(account.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(account)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(account._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>{currentAccount._id ? 'Editar Conta a Pagar' : 'Adicionar Conta a Pagar'}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Fornecedor</InputLabel>
              <Select
                name="supplier"
                value={currentAccount.supplier}
                onChange={handleInputChange}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier._id}>{supplier.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Produto</InputLabel>
              <Select
                name="product"
                value={currentAccount.product}
                onChange={handleInputChange}
              >
                {products.map((product) => (
                  <MenuItem key={product._id} value={product._id}>{product.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              name="quantity"
              label="Quantidade"
              type="number"
              value={currentAccount.quantity}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              name="totalValue"
              label="Valor Total"
              type="number"
              value={currentAccount.totalValue}
              onChange={handleInputChange}
            />
            <DatePicker
              label="Data de Vencimento"
              value={currentAccount.dueDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} color="primary">Salvar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AccountsPayable;
