/**
 * Login page.
 * Centered card with username/password fields and first-login password change dialog.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import { useSnackbar } from 'notistack';
import { useAuth } from '../hooks/useAuth';

/**
 * Login page with form and optional first-login password change dialog.
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, changePassword } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Change password dialog state.
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  /** Handles login form submission. */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      enqueueSnackbar('请输入用户名和密码', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      enqueueSnackbar('登录成功', { variant: 'success' });

      if (result.mustChangePassword) {
        setOldPassword(password);
        setChangePwdOpen(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '登录失败', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /** Handles first-login password change. */
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      enqueueSnackbar('请输入新密码', { variant: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      enqueueSnackbar('两次输入的密码不一致', { variant: 'warning' });
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(newPassword)) {
      enqueueSnackbar('密码至少8位，必须包含字母和数字', { variant: 'warning' });
      return;
    }

    setChangePwdLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      enqueueSnackbar('密码修改成功', { variant: 'success' });
      setChangePwdOpen(false);
      navigate('/');
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : '密码修改失败', { variant: 'error' });
    } finally {
      setChangePwdLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'primary.main',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              售后服务工单管理系统
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请登录以继续
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="密码"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, py: 1.2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : '登录'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
            默认账号: admin / admin123
          </Typography>
        </CardContent>
      </Card>

      {/* First-login password change dialog */}
      <Dialog open={changePwdOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>首次登录请修改密码</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            为保障账户安全，请修改初始密码后再使用系统。
          </Alert>
          <TextField
            fullWidth
            label="原密码"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="新密码"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            helperText="至少8位，必须包含字母和数字"
          />
          <TextField
            fullWidth
            label="确认新密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={changePwdLoading}
          >
            {changePwdLoading ? <CircularProgress size={20} /> : '确认修改'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
