import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProductForm = ({ onProductAdded }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL;
  const { user } = useAuth();

  const getUnitOptions = () => {
    // ... mesma função do ProductList ...
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/api/products`, { name, price, quantity, unit });
      setName('');
      setPrice('');
      setQuantity('');
      setUnit('');
      onProductAdded();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Adicionar Novo Produto</h2>
      <TextField
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Preço"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Quantidade"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        select
        label="Unidade"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        fullWidth
        margin="normal"
        required
      >
        {getUnitOptions().map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
      <Button type="submit" variant="contained" color="primary">
        Adicionar Produto
      </Button>
    </form>
  );
};

export default ProductForm;
