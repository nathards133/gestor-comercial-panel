import React, { useState, useEffect, useRef } from 'react';
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
    const produtoInputRef = useRef(null);
    const quantidadeInputRef = useRef(null);
    const finalizarVendaButtonRef = useRef(null);
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);

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

        // Foca no input de produto após o componente ser montado
        if (produtoInputRef.current) {
            produtoInputRef.current.focus();
        }
    }, []);

    const adicionarAoCarrinho = () => {
        if (produtoSelecionado) {
            setCarrinho([...carrinho, { ...produtoSelecionado, quantidade }]);
            setProdutoSelecionado(null);
            setQuantidade(1);
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (produtoSelecionado && e.target === quantidadeInputRef.current) {
                adicionarAoCarrinho();
            } else if (produtoSelecionado && e.target === produtoInputRef.current) {
                if (quantidadeInputRef.current) {
                    quantidadeInputRef.current.focus();
                }
            } else if (e.target === finalizarVendaButtonRef.current) {
                finalizarVenda();
            }
        } else if (e.key === 'Tab' && e.target === produtoInputRef.current) {
            e.preventDefault();
            if (filteredOptions.length > 0 && !produtoSelecionado) {
                setProdutoSelecionado(filteredOptions[0]);
                setInputValue(filteredOptions[0].name);
                if (quantidadeInputRef.current) {
                    quantidadeInputRef.current.focus();
                }
            }
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
            // Remova a linha abaixo para não navegar para a página de vendas
            // navigate('/sales');

            // Foque novamente no campo de produto após finalizar a venda
            if (produtoInputRef.current) {
                produtoInputRef.current.focus();
            }
        } catch (error) {
            console.error('Erro ao finalizar venda:', error);
        }
    };

    const filterOptions = (options, { inputValue }) => {
        const filtered = options.filter(option =>
            option.name.toLowerCase().includes(inputValue.toLowerCase())
        );
        return filtered;
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h4" align="center" gutterBottom>Frente de Caixa</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3} style={{ padding: '20px' }}>
                    <Typography variant="h6" align="center" gutterBottom>Adicionar Produto</Typography>
                    <Autocomplete
                        options={produtos}
                        getOptionLabel={(option) => `${option.name} - R$ ${option.price.toFixed(2)}`}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Produto"
                                margin="normal"
                                inputRef={produtoInputRef}
                                onKeyDown={handleKeyDown}
                            />
                        )}
                        value={produtoSelecionado}
                        onChange={(event, newValue) => {
                            setProdutoSelecionado(newValue);
                            if (newValue && quantidadeInputRef.current) {
                                quantidadeInputRef.current.focus();
                            }
                        }}
                        inputValue={inputValue}
                        onInputChange={(event, newInputValue) => {
                            setInputValue(newInputValue);
                            const filtered = filterOptions(produtos, { inputValue: newInputValue });
                            setFilteredOptions(filtered);
                        }}
                        filterOptions={(options, state) => filteredOptions}
                        fullWidth
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                    />
                    <TextField
                        type="number"
                        fullWidth
                        label="Quantidade"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value))}
                        margin="normal"
                        inputRef={quantidadeInputRef}
                        onKeyDown={handleKeyDown}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={adicionarAoCarrinho}
                        disabled={!produtoSelecionado}
                    >
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
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={finalizarVenda}
                        ref={finalizarVendaButtonRef}
                        onKeyDown={handleKeyDown}
                    >
                        Finalizar Venda
                    </Button>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Home;
