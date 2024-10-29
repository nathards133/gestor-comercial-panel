import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Autocomplete, Chip, Tooltip, InputAdornment,
  useMediaQuery, useTheme, Card, CardContent, Grid, Divider, TablePagination,
  FormControl, InputLabel, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, WhatsApp as WhatsAppIcon, Search as SearchIcon, Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterCity, setFilterCity] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFiltersApplied, setIsFiltersApplied] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem('supplierFilters')) || {};
    setSortBy(savedFilters.sortBy || 'name');
    setSortOrder(savedFilters.sortOrder || 'asc');
    setFilterCity(savedFilters.filterCity || '');
    setAppliedFilters(savedFilters);
    setIsFiltersApplied(Object.keys(savedFilters).length > 0);
    fetchSuppliers(savedFilters);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            await fetchSuppliers();
            // Outras chamadas de API, se necessário
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            setError('Falha ao carregar dados. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    fetchInitialData();
  }, []);

  const fetchSuppliers = async (filters = appliedFilters) => {
    try {
      const response = await axios.get(`${API_URL}/api/suppliers`, {
        params: {
          ...filters,
          page: page + 1,
          limit: rowsPerPage,
          search: searchProduct
        }
      });
      setSuppliers(response.data.suppliers || []);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems
      });
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setSuppliers([]);
    }
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

  const handleApplyFilters = () => {
    const newFilters = {
      sortBy,
      sortOrder,
      filterCity,
    };
    setAppliedFilters(newFilters);
    setIsFiltersApplied(true);
    localStorage.setItem('supplierFilters', JSON.stringify(newFilters));
    fetchSuppliers(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      sortBy: 'name',
      sortOrder: 'asc',
      filterCity: '',
    };
    setSortBy('name');
    setSortOrder('asc');
    setFilterCity('');
    setAppliedFilters(clearedFilters);
    setIsFiltersApplied(false);
    localStorage.removeItem('supplierFilters');
    fetchSuppliers(clearedFilters);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchSuppliers({ ...appliedFilters, page: newPage + 1 });
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchSuppliers({ ...appliedFilters, page: 1, limit: parseInt(event.target.value, 10) });
  };

  const renderFilterControls = () => (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="filter-controls-content"
        id="filter-controls-header"
      >
        <Typography>
          Filtros e Ordenação
          {isFiltersApplied && (
            <Chip
              size="small"
              label="Filtros aplicados"
              color="primary"
              style={{ marginLeft: 10 }}
            />
          )}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Ordenar por"
              >
                <MenuItem value="name">Nome</MenuItem>
                <MenuItem value="cnpj">CNPJ</MenuItem>
                <MenuItem value="email">Email</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              fullWidth
              variant="outlined"
            >
              {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Filtrar por cidade"
              variant="outlined"
              size="small"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyFilters}
              fullWidth
            >
              Aplicar Filtros
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
            >
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
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

      {renderFilterControls()}

      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {isMobile ? (
        suppliers.map(renderSupplierCard)
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
              {suppliers.map((supplier) => (
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

      <TablePagination
        component="div"
        count={pagination.totalItems}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

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
