import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Alert
} from '@mui/material';

const StockManagement = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
    checkLowStock();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    }
  };

  const checkLowStock = async () => {
    const response = await axios.get('${process.env.REACT_APP_API_URL}/api/stock/low-stock');
    setLowStockProducts(response.data);
  };

  const handleAddStock = async () => {
    await axios.post('${process.env.REACT_APP_API_URL}/api/stock/add', {
      productId: selectedProduct,
      quantity: Number(quantity)
    });
    fetchProducts();
    checkLowStock();
  };

  const handleRemoveStock = async () => {
    await axios.post('${process.env.REACT_APP_API_URL}/api/stock/remove', {
      productId: selectedProduct,
      quantity: Number(quantity)
    });
    fetchProducts();
    checkLowStock();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestão de Estoque</Typography>
      
      {lowStockProducts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Produtos com estoque baixo: {lowStockProducts.map(p => p.name).join(', ')}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Produto"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          sx={{ mr: 2 }}
        >
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </TextField>
        <TextField
          type="number"
          label="Quantidade"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleAddStock} sx={{ mr: 1 }}>
          Adicionar Estoque
        </Button>
        <Button variant="contained" color="secondary" onClick={handleRemoveStock}>
          Remover Estoque
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell align="right">Quantidade em Estoque</TableCell>
              <TableCell align="right">Nível Mínimo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell component="th" scope="row">
                    {product.name}
                  </TableCell>
                  <TableCell align="right">{product.quantity}</TableCell>
                  <TableCell align="right">{product.minStockLevel}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3}>Nenhum produto encontrado</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StockManagement;
