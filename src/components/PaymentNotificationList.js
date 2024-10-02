import React from 'react';
import { Box, Typography } from '@mui/material';
import PaymentNotification from './PaymentNotification';

const PaymentNotificationList = ({ notifications }) => {
  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Notificações de Pagamento
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {notifications.map((notification, index) => (
          <PaymentNotification key={index} {...notification} />
        ))}
      </Box>
    </Box>
  );
};

export default PaymentNotificationList;
