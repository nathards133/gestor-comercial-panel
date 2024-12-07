import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const NotificationList = ({ notifications }) => {
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {notifications.map((notification, index) => (
        <React.Fragment key={notification._id || index}>
          <ListItem alignItems="flex-start">
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon color="warning" />
            </Box>
            <ListItemText
              primary={
                <Typography
                  component="span"
                  variant="body1"
                  color="text.primary"
                >
                  {notification.message}
                </Typography>
              }
              secondary={
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              }
            />
          </ListItem>
          {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
      {notifications.length === 0 && (
        <ListItem>
          <ListItemText
            primary={
              <Typography variant="body2" color="text.secondary" align="center">
                Nenhuma notificação
              </Typography>
            }
          />
        </ListItem>
      )}
    </List>
  );
};

export default NotificationList; 