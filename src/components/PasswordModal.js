import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';

const PasswordModal = ({ open, onClose, onSubmit, title, alert }) => {
  const [password, setPassword] = useState('');
  

  const handleSubmit = () => {
    onSubmit(password);
    setPassword('');
  };



  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      {alert && <Alert severity="info" sx={{ mb: 2 }}>{alert}</Alert>}
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Senha"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={password.length !== 4}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordModal;
