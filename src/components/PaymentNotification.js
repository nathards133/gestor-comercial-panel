import React from 'react';
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const PaymentAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
}));

const PaymentNotification = ({ message, data, createdAt }) => {
  return (
    <StyledPaper elevation={3}>
      <PaymentAvatar>
        <AttachMoneyIcon />
      </PaymentAvatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {message}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Chip
            label={data.paymentMethod}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            {new Date(createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>
      <CheckCircleOutlineIcon color="success" fontSize="large" />
    </StyledPaper>
  );
};

export default PaymentNotification;
