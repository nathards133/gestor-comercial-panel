import React, { useState } from 'react';
import axios from 'axios';

const ProductItem = ({ product, onProductUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price);
  const [quantity, setQuantity] = useState(product.quantity);

  const handleUpdate = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/products/${product._id}`, {
        name,
        price,
        quantity
      });
      setIsEditing(false);
      onProductUpdated();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/products/${product._id}`);
      onProductUpdated();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  if (isEditing) {
    return (
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button onClick={handleUpdate}>Salvar</button>
        <button onClick={() => setIsEditing(false)}>Cancelar</button>
      </div>
    );
  }

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Preço: R$ {product.price}</p>
      <p>Quantidade: {product.quantity}</p>
      <button onClick={() => setIsEditing(true)}>Editar</button>
      <button onClick={handleDelete}>Excluir</button>
    </div>
  );
};

export default ProductItem;
