import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  useMediaQuery, useTheme, Switch, FormControlLabel, Tabs, Tab, Checkbox, Chip,
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Payment as PaymentIcon, Search as SearchIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AccountsPayable = () => {
  const [accounts, setAccounts] = useState({ 
    accountsPayable: [], 
    recurringAccounts: [], 
    installmentAccounts: [] 
  });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({
    type: '', supplier: '', product: '', quantity: '', totalValue: '', dueDate: null, dueDay: '', description: ''
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [openInstallmentModal, setOpenInstallmentModal] = useState(false);
  const [currentInstallments, setCurrentInstallments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
      setAccounts({
        accountsPayable: response.data.accountsPayable || [],
        recurringAccounts: response.data.recurringAccounts || [],
        installmentAccounts: response.data.installmentAccounts || []
      });
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      setAccounts({ accountsPayable: [], recurringAccounts: [], installmentAccounts: [] });
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
      const accountData = { 
        ...currentAccount, 
        isRecurring, 
        isInstallment, 
        totalInstallments: isInstallment ? totalInstallments : undefined 
      };
      if (currentAccount._id) {
        await axios.put(`${API_URL}/api/accounts-payable/${currentAccount._id}?isRecurring=${isRecurring}`, accountData);
      } else {
        await axios.post(`${API_URL}/api/accounts-payable`, accountData);
      }
      setOpenDialog(false);
      await fetchAccounts();
      setTabValue(isRecurring ? 1 : isInstallment ? 2 : 0);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const handleEdit = async (account, recurring, installment) => {
    if (installment) {
      try {
        const response = await axios.get(`${API_URL}/api/accounts-payable/installments/${account._id}`);
        console.log('Parcelas recebidas:', response.data.installments);
        setCurrentInstallments(response.data.installments || []);
        setOpenInstallmentModal(true);
      } catch (error) {
        console.error('Erro ao buscar detalhes das parcelas:', error);
        setCurrentInstallments([]);
      }
    } else {
      setCurrentAccount(account);
      setIsRecurring(recurring);
      setIsInstallment(account.isInstallment);
      setTotalInstallments(account.totalInstallments || 2);
      setOpenDialog(true);
    }
  };

  const handleDelete = async (id, recurring) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await axios.delete(`${API_URL}/api/accounts-payable/${id}?isRecurring=${recurring}`);
        fetchAccounts();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
      }
    }
  };

  const handleSelectAccount = (id) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(accountId => accountId !== id) : [...prev, id]
    );
  };

  const handleSelectAllAccounts = (event, accounts) => {
    if (event.target.checked) {
      setSelectedAccounts(accounts.map(account => account._id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const response = await axios.put(`${API_URL}/api/accounts-payable/mark-as-paid`, { ids: selectedAccounts });
      console.log('Resposta do servidor:', response.data);
      
      // Atualizar as contas localmente
      setAccounts(prevAccounts => {
        const updatedAccounts = { ...prevAccounts };
        response.data.updatedAccounts.forEach(updatedAccount => {
          if (updatedAccount.isInstallment) {
            // Remover a conta paga e adicionar a próxima parcela
            updatedAccounts.installmentAccounts = updatedAccounts.installmentAccounts.filter(
              account => account._id !== selectedAccounts.find(id => id === account._id)
            );
            updatedAccounts.installmentAccounts.push(updatedAccount);
          } else {
            // Atualizar contas não parceladas
            ['accountsPayable', 'recurringAccounts'].forEach(accountType => {
              updatedAccounts[accountType] = updatedAccounts[accountType].map(account =>
                account._id === updatedAccount._id ? updatedAccount : account
              );
            });
          }
        });
        return updatedAccounts;
      });

      setSelectedAccounts([]);
    } catch (error) {
      console.error('Erro ao marcar contas como pagas:', error);
      // Adicione uma notificação de erro para o usuário aqui
    }
  };

  const getStatusChip = (account) => {
    const today = new Date();
    const dueDate = new Date(account.dueDate);
    
    if (account.isPaid) {
      return <Chip label="Paga" color="success" />;
    } else if (dueDate < today) {
      return <Chip label="Atrasada" color="error" />;
    } else {
      return <Chip label="A vencer" color="primary" />;
    }
  };

  const renderAccountsTable = (accountsList = [], recurring, installment) => {
    const filteredAccounts = accountsList.filter(account => 
      (account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.supplier && account.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.product && account.product.name.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (!installment || !account.isPaid) // Não mostrar contas parceladas pagas
    );

    const groupedAccounts = filteredAccounts.reduce((acc, account) => {
      if (installment) {
        if (!acc[account.parentInstallmentId || account._id]) {
          acc[account.parentInstallmentId || account._id] = {
            ...account,
            installments: [account]
          };
        } else {
          acc[account.parentInstallmentId || account._id].installments.push(account);
        }
      } else {
        acc[account._id] = account;
      }
      return acc;
    }, {});

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={(event) => handleSelectAllAccounts(event, Object.values(groupedAccounts))}
                  checked={Object.keys(groupedAccounts).length > 0 && selectedAccounts.length === Object.keys(groupedAccounts).length}
                  indeterminate={selectedAccounts.length > 0 && selectedAccounts.length < Object.keys(groupedAccounts).length}
                />
              </TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>{recurring ? 'Dia de Vencimento' : 'Data de Vencimento'}</TableCell>
              {installment && <TableCell>Parcelas</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(groupedAccounts).map((account) => (
              <TableRow key={account._id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedAccounts.includes(account._id)}
                    onChange={() => handleSelectAccount(account._id)}
                  />
                </TableCell>
                <TableCell>{account.type}</TableCell>
                <TableCell>{account.description || `${account.supplier?.name} - ${account.product?.name}`}</TableCell>
                <TableCell>R$ {account.totalValue.toFixed(2)}</TableCell>
                <TableCell>
                  {recurring 
                    ? `Dia ${account.dueDay}`
                    : new Date(account.dueDate).toLocaleDateString()
                  }
                </TableCell>
                {installment && (
                  <TableCell>{`${account.installments[0].installmentNumber}/${account.totalInstallments}`}</TableCell>
                )}
                <TableCell>{getStatusChip(account)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(account, recurring, installment)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(account._id, recurring)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderInstallmentModal = () => {
    console.log('Renderizando modal de parcelas. currentInstallments:', currentInstallments);
    return (
      <Dialog open={openInstallmentModal} onClose={() => setOpenInstallmentModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes das Parcelas</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nº Parcela</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Data de Vencimento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(currentInstallments) && currentInstallments.length > 0 ? (
                  currentInstallments.map((installment) => (
                    <TableRow key={installment._id}>
                      <TableCell>{`${installment.installmentNumber}/${installment.totalInstallments}`}</TableCell>
                      <TableCell>R$ {installment.installmentValue.toFixed(2)}</TableCell>
                      <TableCell>{new Date(installment.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusChip(installment)}</TableCell>
                      <TableCell>
                        {!installment.isPaid && (
                          <IconButton onClick={() => handleInstallmentPayment(installment._id)}>
                            <PaymentIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhuma parcela encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInstallmentModal(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const handleInstallmentPayment = async (installmentId) => {
    try {
      const response = await axios.put(`${API_URL}/api/accounts-payable/mark-as-paid`, { ids: [installmentId] });
      const updatedAccount = response.data.updatedAccounts[0];
      
      setCurrentInstallments(prevInstallments =>
        prevInstallments.map(installment =>
          installment._id === installmentId ? { ...installment, isPaid: true } : installment
        )
      );
    
      // Atualizar a lista principal de contas
      setAccounts(prevAccounts => ({
        ...prevAccounts,
        installmentAccounts: prevAccounts.installmentAccounts.map(account =>
          account._id === installmentId ? { ...account, isPaid: true } : account
        )
      }));
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Contas a Pagar
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row' }}>
          <TextField
            variant="outlined"
            placeholder="Buscar por descrição, fornecedor ou produto"
            value={searchTerm}
            onChange={handleSearchChange}
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
              setCurrentAccount({
                type: '', supplier: '', product: '', quantity: '', totalValue: '', dueDate: null, dueDay: '', description: ''
              });
              setIsRecurring(false);
              setIsInstallment(false);
              setOpenDialog(true);
            }}
            startIcon={<AddIcon />}
            fullWidth={isMobile}
          >
            Adicionar Conta
          </Button>
        </Box>

        {selectedAccounts.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleMarkAsPaid}
            sx={{ mb: 2 }}
          >
            Marcar como Paga
          </Button>
        )}

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Contas Pontuais" />
          <Tab label="Contas Recorrentes" />
          <Tab label="Contas Parceladas" />
        </Tabs>

        {tabValue === 0 && renderAccountsTable(accounts.accountsPayable, false, false)}
        {tabValue === 1 && renderAccountsTable(accounts.recurringAccounts, true, false)}
        {tabValue === 2 && renderAccountsTable(accounts.installmentAccounts, false, true)}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>{currentAccount._id ? 'Editar Conta' : 'Adicionar Conta'}</DialogTitle>
          <DialogContent>
            <FormControlLabel
              control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />}
              label="Conta Recorrente"
            />
            <FormControlLabel
              control={<Switch checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} />}
              label="Conta Parcelada"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo</InputLabel>
              <Select
                name="type"
                value={currentAccount.type}
                onChange={handleInputChange}
              >
                <MenuItem value="supplier">Fornecedor</MenuItem>
                <MenuItem value="rent">Aluguel</MenuItem>
                <MenuItem value="other">Outro</MenuItem>
              </Select>
            </FormControl>
            {currentAccount.type === 'supplier' && (
              <>
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
              </>
            )}
            {(currentAccount.type === 'rent' || currentAccount.type === 'other') && (
              <TextField
                fullWidth
                margin="normal"
                name="description"
                label="Descrição"
                value={currentAccount.description}
                onChange={handleInputChange}
              />
            )}
            <TextField
              fullWidth
              margin="normal"
              name="totalValue"
              label="Valor Total"
              type="number"
              value={currentAccount.totalValue}
              onChange={handleInputChange}
            />
            {isInstallment && (
              <TextField
                fullWidth
                margin="normal"
                name="totalInstallments"
                label="Número de Parcelas"
                type="number"
                inputProps={{ min: 2 }}
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
              />
            )}
            {isRecurring ? (
              <TextField
                fullWidth
                margin="normal"
                name="dueDay"
                label="Dia de Vencimento"
                type="number"
                inputProps={{ min: 1, max: 31 }}
                value={currentAccount.dueDay}
                onChange={handleInputChange}
              />
            ) : (
              <DatePicker
                label="Data de Vencimento"
                value={currentAccount.dueDate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} color="primary">Salvar</Button>
          </DialogActions>
        </Dialog>
        {renderInstallmentModal()}
      </Box>
    </LocalizationProvider>
  );
};

export default AccountsPayable;