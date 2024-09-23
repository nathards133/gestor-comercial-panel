import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, Grid, Paper, List, ListItem, ListItemText, IconButton, Autocomplete } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [carrinho, setCarrinho] = useState([]);
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        const resposta = await axios.get(`${apiUrl}/api/products`);
        setProdutos(resposta.data);
      } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
      }
    };
    buscarProdutos();
  }, []);

  const adicionarAoCarrinho = () => {
    if (produtoSelecionado) {
      setCarrinho([...carrinho, { ...produtoSelecionado, quantidade }]);
      setProdutoSelecionado(null);
      setQuantidade(1);
    }
  };

  const removerDoCarrinho = (index) => {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    setCarrinho(novoCarrinho);
  };

  const finalizarVenda = async () => {
    try {
      const saleResponse = await axios.post(`${apiUrl}/api/sales`, { items: carrinho });
      
      // Atualizar o estoque
    //   for (let item of carrinho) {
    //     await axios.post('${process.env.REACT_APP_API_URL}/api/stock/remove', {
    //       productId: item._id,
    //       quantity: item.quantidade
    //     });
    //   }

      setCarrinho([]);
      navigate('/sales');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4"  align="center" gutterBottom>Frente de Caixa</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6"  align="center" gutterBottom>Adicionar Produto</Typography>
          <Autocomplete
            options={produtos}
            getOptionLabel={(option) => `${option.name} - R$ ${option.price.toFixed(2)}`}
            renderInput={(params) => <TextField {...params} label="Produto" margin="normal" />}
            value={produtoSelecionado}
            onChange={(event, newValue) => {
              setProdutoSelecionado(newValue);
            }}
            fullWidth
          />
          <TextField
            type="number"
            fullWidth
            label="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value))}
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={adicionarAoCarrinho}>
            Adicionar ao Carrinho
          </Button>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Carrinho</Typography>
          <List>
            {carrinho.map((item, index) => (
              <ListItem key={index} secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => removerDoCarrinho(index)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemText
                  primary={`${item.name} - ${item.quantidade}x R$ ${item.price.toFixed(2)}`}
                  secondary={`Total: R$ ${(item.price * item.quantidade).toFixed(2)}`}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="h6">
            Total: R$ {carrinho.reduce((acc, item) => acc + item.price * item.quantidade, 0).toFixed(2)}
          </Typography>
          <Button variant="contained" color="secondary" onClick={finalizarVenda}>
            Finalizar Venda
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Home;
