import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import PaymentNotification from './PaymentNotification';

const PaymentNotificationList = ({ notifications }) => {
  const totalSales = notifications.reduce((sum, notification) => sum + notification.data.amount, 0);
  const salesCount = notifications.length;

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Total de Vendas: R$ {totalSales.toFixed(2)}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Número de Vendas: {salesCount}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {notifications.map((notification, index) => (
          <PaymentNotification key={index} {...notification} />
        ))}
      </Box>
    </Box>
  );
};

export default PaymentNotificationList;
