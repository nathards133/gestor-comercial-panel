import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  useMediaQuery, useTheme, Switch, FormControlLabel, Tabs, Tab, Checkbox, Chip,
  InputAdornment, FormHelperText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Payment as PaymentIcon, Search as SearchIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NumericFormat } from 'react-number-format';

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
    type: '',
    supplier: '',
    product: '',
    quantity: '',
    totalValue: '',
    dueDate: null,
    dueDay: '',
    description: '',
    installments: []
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [openInstallmentModal, setOpenInstallmentModal] = useState(false);
  const [currentInstallments, setCurrentInstallments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthlyStats, setMonthlyStats] = useState({
    totalDue: 0,
    totalPending: 0,
    totalPaid: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchSuppliers(),
          fetchProducts(),
          fetchAccounts()
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
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
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      setError('Erro ao carregar fornecedores');
      setSuppliers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setError('Erro ao carregar produtos');
      setProducts([]);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/accounts-payable/monthly-stats`);
      setMonthlyStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas mensais:', error);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderMonthlyStats = () => (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      mb: 3, 
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      <Paper sx={{ 
        flex: 1, 
        p: 2, 
        textAlign: 'center',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Typography variant="h6">Total do Mês</Typography>
        <Typography variant="h4">{formatCurrency(monthlyStats.totalDue)}</Typography>
      </Paper>
      <Paper sx={{ 
        flex: 1, 
        p: 2, 
        textAlign: 'center',
        bgcolor: 'warning.main',
        color: 'white'
      }}>
        <Typography variant="h6">Pendente</Typography>
        <Typography variant="h4">{formatCurrency(monthlyStats.totalPending)}</Typography>
      </Paper>
      <Paper sx={{ 
        flex: 1, 
        p: 2, 
        textAlign: 'center',
        bgcolor: 'success.main',
        color: 'white'
      }}>
        <Typography variant="h6">Pago</Typography>
        <Typography variant="h4">{formatCurrency(monthlyStats.totalPaid)}</Typography>
      </Paper>
    </Box>
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'totalValue' || name === 'quantity') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setFormErrors(prev => ({
          ...prev,
          [name]: `${name === 'totalValue' ? 'Valor' : 'Quantidade'} deve ser um número positivo`
        }));
        return;
      }
    }

    if (name === 'dueDay') {
      const day = parseInt(value);
      if (isNaN(day) || day < 1 || day > 31) {
        setFormErrors(prev => ({
          ...prev,
          dueDay: 'Dia deve estar entre 1 e 31'
        }));
        return;
      }
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCurrentAccount(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setCurrentAccount(prev => ({ ...prev, [name]: value }));
    }

    setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleDateChange = (date) => {
    if (date && isValid(date)) {
      setCurrentAccount(prev => ({
        ...prev,
        dueDate: format(date, 'yyyy-MM-dd')
      }));
      setFormErrors(prev => ({ ...prev, dueDate: null }));
    } else {
      setFormErrors(prev => ({ 
        ...prev, 
        dueDate: 'Data inválida' 
      }));
    }
  };

  const formatToCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const currencyToNumber = (currencyString) => {
    if (!currencyString) return 0;
    return Number(currencyString.replace(/[^\d,]/g, '').replace(',', '.'));
  };

  const handleValueChange = (values) => {
    const { value } = values;
    setCurrentAccount(prev => ({
      ...prev,
      totalValue: value
    }));
    
    if (value && Number(value) > 0) {
      setFormErrors(prev => ({ ...prev, totalValue: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validação básica dos campos obrigatórios
    if (!currentAccount.type) {
      errors.type = 'Tipo é obrigatório';
    }

    if (currentAccount.type === 'supplier') {
      if (!currentAccount.supplier) {
        errors.supplier = 'Fornecedor é obrigatório';
      }
      if (!currentAccount.product) {
        errors.product = 'Produto é obrigatório';
      }
      if (!currentAccount.quantity || currentAccount.quantity <= 0) {
        errors.quantity = 'Quantidade deve ser maior que zero';
      }
    }

    if ((currentAccount.type === 'rent' || currentAccount.type === 'other') && !currentAccount.description) {
      errors.description = 'Descrição é obrigatória';
    }

    const totalValue = currencyToNumber(currentAccount.totalValue);
    if (!totalValue || totalValue <= 0) {
      errors.totalValue = 'Valor total deve ser maior que zero';
    }

    if (isRecurring && (!currentAccount.dueDay || currentAccount.dueDay < 1 || currentAccount.dueDay > 31)) {
      errors.dueDay = 'Dia de vencimento deve estar entre 1 e 31';
    }

    if (!isRecurring && !currentAccount.dueDate) {
      errors.dueDate = 'Data de vencimento é obrigatória';
    }

    if (isInstallment && (!totalInstallments || totalInstallments < 2)) {
      errors.totalInstallments = 'Número de parcelas deve ser maior que 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const formData = {
        ...currentAccount,
        totalValue: currencyToNumber(currentAccount.totalValue)
      };

      if (currentAccount._id) {
        await axios.put(`${API_URL}/api/accounts-payable/${currentAccount._id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/accounts-payable`, formData);
      }
      
      setOpenDialog(false);
      fetchAccounts();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      setFormErrors(prev => ({
        ...prev,
        submit: 'Erro ao salvar conta. Por favor, tente novamente.'
      }));
    }
  };

  const handleEdit = async (account, recurring, installment) => {
    if (installment) {
      try {
        const response = await axios.get(`${API_URL}/api/accounts-payable/installments/${account._id}`);
        console.log('Resposta da API:', response.data);
        
        // Filtrar parcelas com o mesmo parentInstallmentId ou a própria conta se for a primeira parcela
        const installments = response.data.installmentAccounts.filter(
          inst => inst.parentInstallmentId === account.parentInstallmentId || 
                  inst._id === account.parentInstallmentId ||
                  (inst._id === account._id && !inst.parentInstallmentId)
        );
        
        setCurrentInstallments(installments);
        setOpenInstallmentModal(true);
      } catch (error) {
        console.error('Erro ao buscar detalhes das parcelas:', error);
        setCurrentInstallments([]);
      }
    } else {
      setCurrentAccount({
        ...account,
        dueDate: account.dueDate ? format(new Date(account.dueDate), 'dd/MM/yyyy') : ''
      });
      setIsRecurring(recurring);
      setIsInstallment(account.isInstallment);
      setTotalInstallments(account.totalInstallments || 2);
      setOpenDialog(true);
    }
  };

  const handleDelete = async (account, recurring) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await axios.delete(`${API_URL}/api/accounts-payable/?id=${account._id}&isRecurring=${recurring}`);
        await fetchAccounts();
        await fetchMonthlyStats();
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

      await fetchMonthlyStats();
      setSelectedAccounts([]);
    } catch (error) {
      console.error('Erro ao marcar contas como pagas:', error);
      // Adicione uma notificaço de erro para o usuário aqui
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

  const getAccountTypeName = (type) => {
    const typeMap = {
      supplier: 'Fornecedor',
      rent: 'Aluguel',
      other: 'Outro'
    };
    return typeMap[type] || type;
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
                <TableCell>{getAccountTypeName(account.type)}</TableCell>
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
                  <IconButton onClick={() => handleDelete(account, recurring)}>
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

  const renderInstallmentModal = () => (
    <Dialog open={openInstallmentModal} onClose={() => setOpenInstallmentModal(false)} maxWidth="md" fullWidth>
      <DialogTitle>Detalhes das Parcelas - {currentInstallments[0]?.description}</DialogTitle>
      <DialogContent>
        {Array.isArray(currentInstallments) && currentInstallments.length > 0 ? (
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
                {currentInstallments.map((installment) => (
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>Nenhuma parcela encontrada.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenInstallmentModal(false)}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );

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

  const resetForm = () => {
    setCurrentAccount({
      type: '',
      supplier: '',
      product: '',
      quantity: '',
      totalValue: '',
      dueDate: null,
      dueDay: '',
      description: '',
      installments: []
    });
    setFormErrors({});
    setIsRecurring(false);
    setIsInstallment(false);
    setTotalInstallments(2);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Contas a Pagar
        </Typography>

        {renderMonthlyStats()}

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
              resetForm();
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
          <Tab label="Contas Eventuais" />
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
            <FormControl fullWidth margin="normal" error={!!formErrors.type}>
              <InputLabel>Tipo</InputLabel>
              <Select
                name="type"
                value={currentAccount.type}
                onChange={handleInputChange}
              >
                <MenuItem value="supplier">{getAccountTypeName('supplier')}</MenuItem>
                <MenuItem value="rent">{getAccountTypeName('rent')}</MenuItem>
                <MenuItem value="other">{getAccountTypeName('other')}</MenuItem>
              </Select>
              {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
            </FormControl>

            {currentAccount.type === 'supplier' && (
              <>
                <FormControl fullWidth margin="normal" error={!!formErrors.supplier}>
                  <InputLabel>Fornecedor</InputLabel>
                  <Select
                    name="supplier"
                    value={currentAccount.supplier}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <MenuItem disabled>Carregando fornecedores...</MenuItem>
                    ) : error ? (
                      <MenuItem disabled>Erro ao carregar fornecedores</MenuItem>
                    ) : suppliers.length === 0 ? (
                      <MenuItem disabled>Nenhum fornecedor cadastrado</MenuItem>
                    ) : (
                      suppliers.map((supplier) => (
                        <MenuItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {formErrors.supplier && <FormHelperText>{formErrors.supplier}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth margin="normal" error={!!formErrors.product}>
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
                  {formErrors.product && <FormHelperText>{formErrors.product}</FormHelperText>}
                </FormControl>

                <TextField
                  fullWidth
                  margin="normal"
                  name="quantity"
                  label="Quantidade"
                  type="number"
                  value={currentAccount.quantity}
                  onChange={handleInputChange}
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
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
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            )}

            <NumericFormat
              fullWidth
              margin="normal"
              label="Valor Total"
              value={currentAccount.totalValue}
              onValueChange={handleValueChange}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              customInput={TextField}
              error={!!formErrors.totalValue}
              helperText={formErrors.totalValue}
              required
              InputProps={{
                inputProps: {
                  min: 0,
                  step: 0.01
                }
              }}
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
                error={!!formErrors.totalInstallments}
                helperText={formErrors.totalInstallments}
                required
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
                error={!!formErrors.dueDay}
                helperText={formErrors.dueDay}
                required
              />
            ) : (
              <DatePicker
                label="Data de Vencimento"
                value={currentAccount.dueDate ? new Date(currentAccount.dueDate) : null}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.dueDate}
                    helperText={formErrors.dueDate || 'DD/MM/AAAA'}
                    required
                    inputProps={{
                      ...params.inputProps,
                      placeholder: 'DD/MM/AAAA'
                    }}
                  />
                )}
                format="dd/MM/yyyy"
                mask="__/__/____"
                locale={ptBR}
                disableOpenPicker={false}
                clearable
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