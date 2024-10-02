import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

const WarningMessage = ({ title, message, severity = 'info' }) => {
  return (
    <Alert severity={severity} sx={{ mt: 2, mb: 2 }}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  );
};

export default WarningMessage;
