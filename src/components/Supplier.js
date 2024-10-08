import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Autocomplete, Chip, Tooltip, InputAdornment,
  useMediaQuery, useTheme, Card, CardContent, Grid, Divider
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, WhatsApp as WhatsAppIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState({
    name: '', cnpj: '', email: '', phone: '',
    address: { street: '', number: '', complement: '', city: '', state: '', zipCode: '' },
    suppliedProducts: []
  });
  const [searchProduct, setSearchProduct] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/suppliers`);
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    const response = await axios.get(`${API_URL}/api/products`);
    setProducts(response.data.products);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCurrentSupplier(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setCurrentSupplier(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductChange = (event, newValue) => {
    setCurrentSupplier(prev => ({ ...prev, suppliedProducts: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentSupplier._id) {
        await axios.put(`${API_URL}/api/suppliers/${currentSupplier._id}`, currentSupplier);
      } else {
        await axios.post(`${API_URL}/api/suppliers`, currentSupplier);
      }
      setOpenDialog(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await axios.delete(`${API_URL}/api/suppliers/${id}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
      }
    }
  };

  const getWhatsAppLink = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.suppliedProducts.some(product =>
      product.name.toLowerCase().includes(searchProduct.toLowerCase())
    )
  );

  const renderSupplierCard = (supplier) => (
    <Card key={supplier._id} sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div">{supplier.name}</Typography>
        <Typography color="text.secondary" gutterBottom>CNPJ: {supplier.cnpj}</Typography>
        <Typography variant="body2">Email: {supplier.email}</Typography>
        <Typography variant="body2">Telefone: {supplier.phone}</Typography>
        <Tooltip title={supplier.suppliedProducts.map(p => p.name).join(', ')}>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Produtos fornecidos: {supplier.suppliedProducts.length}
          </Typography>
        </Tooltip>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <IconButton onClick={() => handleEdit(supplier)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(supplier._id)}>
            <DeleteIcon />
          </IconButton>
          <IconButton href={getWhatsAppLink(supplier.phone)} target="_blank">
            <WhatsAppIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant={isMobile ? "h5" : "h4"} gutterBottom align="center">
        Gestão de Fornecedores
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row' }}>
        <TextField
          variant="outlined"
          placeholder="Buscar fornecedor por produto"
          value={searchProduct}
          onChange={(e) => setSearchProduct(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: isMobile ? 2 : 0, flexGrow: 1, mr: isMobile ? 0 : 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setCurrentSupplier({
              name: '', cnpj: '', email: '', phone: '',
              address: { street: '', number: '', complement: '', city: '', state: '', zipCode: '' },
              suppliedProducts: []
            });
            setOpenDialog(true);
          }}
          startIcon={<AddIcon />}
          fullWidth={isMobile}
        >
          Adicionar Fornecedor
        </Button>
      </Box>

      {isMobile ? (
        filteredSuppliers.map(renderSupplierCard)
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Produtos Fornecidos</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.cnpj}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>
                    <Tooltip title={supplier.suppliedProducts.map(p => p.name).join(', ')}>
                      <Typography>
                        {supplier.suppliedProducts.length} produto(s)
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(supplier)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(supplier._id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton href={getWhatsAppLink(supplier.phone)} target="_blank">
                      <WhatsAppIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{currentSupplier._id ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            name="name"
            label="Nome"
            value={currentSupplier.name}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="cnpj"
            label="CNPJ"
            value={currentSupplier.cnpj}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="email"
            label="Email"
            value={currentSupplier.email}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="phone"
            label="Telefone"
            value={currentSupplier.phone}
            onChange={handleInputChange}
          />
          <Autocomplete
            multiple
            options={products}
            getOptionLabel={(option) => option.name}
            value={currentSupplier.suppliedProducts}
            onChange={handleProductChange}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Produtos Fornecidos"
                placeholder="Selecione os produtos"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
              ))
            }
          />
          <TextField
            fullWidth
            margin="dense"
            name="address.street"
            label="Rua"
            value={currentSupplier.address.street}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="address.number"
            label="Número"
            value={currentSupplier.address.number}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="address.complement"
            label="Complemento"
            value={currentSupplier.address.complement}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="address.city"
            label="Cidade"
            value={currentSupplier.address.city}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="address.state"
            label="Estado"
            value={currentSupplier.address.state}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="address.zipCode"
            label="CEP"
            value={currentSupplier.address.zipCode}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} color="primary">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierManagement;