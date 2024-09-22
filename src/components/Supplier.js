import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState({
    name: '', cnpj: '', email: '', phone: '',
    address: { street: '', number: '', complement: '', city: '', state: '', zipCode: '' }
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const response = await axios.get(`${API_URL}/api/suppliers`);
    setSuppliers(response.data);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestão de Fornecedores</Typography>
      
      <Button variant="contained" color="primary" onClick={() => {
        setCurrentSupplier({
          name: '', cnpj: '', email: '', phone: '',
          address: { street: '', number: '', complement: '', city: '', state: '', zipCode: '' }
        });
        setOpenDialog(true);
      }} sx={{ mb: 2 }}>
        Adicionar Fornecedor
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
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
                  <IconButton onClick={() => handleEdit(supplier)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(supplier._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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