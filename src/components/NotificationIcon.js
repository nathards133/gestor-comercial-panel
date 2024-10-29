import React, { useState, useRef, useEffect } from 'react';
import { IconButton, Badge, Popover, Box, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentNotificationList from './PaymentNotificationList';

const NotificationIcon = ({ notifications }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const iconRef = useRef(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        ref={iconRef}
      >
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 350, maxHeight: 400, overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>Notificações</Typography>
          <PaymentNotificationList notifications={notifications} />
        </Box>
      </Popover>
    </>
  );
};

export default NotificationIcon;
