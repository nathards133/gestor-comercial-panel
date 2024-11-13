import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert } from '@mui/material';

const PasswordModal = ({ open, onClose, onSuccess, title, message }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password.length === 4) {
      onSuccess(password);
      setPassword('');
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Senha"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={password.length !== 4}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordModal;
