import React, { useState } from 'react';
import axios from 'axios';

const ProductForm = ({ onProductAdded }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('${process.env.REACT_APP_API_URL}/api/products', { name, price, quantity });
      setName('');
      setPrice('');
      setQuantity('');
      onProductAdded();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Adicionar Novo Produto</h2>
      <div>
        <label htmlFor="name">Nome:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="price">Preço:</label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="quantity">Quantidade:</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>
      <button type="submit">Adicionar Produto</button>
    </form>
  );
};

export default ProductForm;
