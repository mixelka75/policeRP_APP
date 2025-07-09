import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Shield, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button, Input, Card } from '@/components/ui';
import { validateForm } from '@/utils';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationRules = {
      username: {
        required: true,
        minLength: 3,
        label: 'Логин',
      },
      password: {
        required: true,
        minLength: 6,
        label: 'Пароль',
      },
    };

    const errors = validateForm(formData, validationRules);
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      try {
        await login(formData);
      } catch (err) {
        // Error is handled in the store
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Авторизация
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-dark-400"
          >
            Введите данные для входа в систему
          </motion.p>
        </div>

        {/* Login Form */}
        <Card className="backdrop-blur-sm bg-dark-800/50 border-dark-600/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Username Field */}
            <Input
              name="username"
              type="text"
              placeholder="Введите логин"
              value={formData.username}
              onChange={handleInputChange}
              error={formErrors.username}
              leftIcon={<User className="h-5 w-5" />}
              fullWidth
              disabled={isLoading}
            />

            {/* Password Field */}
            <Input
              name="password"
              type="password"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleInputChange}
              error={formErrors.password}
              leftIcon={<Lock className="h-5 w-5" />}
              fullWidth
              disabled={isLoading}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Войти
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-dark-400 text-sm">
            РП Сервер - Система управления
          </p>
          <p className="text-dark-500 text-xs mt-1">
            v1.0.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;