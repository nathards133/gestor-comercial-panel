import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useConfig } from '../contexts/ConfigContext';
import ReceiptIcon from '@mui/icons-material/Receipt';

const ConfigPanel = ({ open, onClose }) => {
  const { nfeEnabled, toggleNfeGeneration } = useConfig();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Configurações do Sistema</DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemIcon>
              <ReceiptIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Geração de Notas Fiscais"
              secondary={nfeEnabled ? "Ativada" : "Desativada"}
            />
            <Switch
              edge="end"
              checked={nfeEnabled}
              onChange={toggleNfeGeneration}
            />
          </ListItem>
          <Divider />
          {/* Adicione mais opções de configuração aqui */}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigPanel; 