import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AuthLayout from '../../layouts/AuthLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const schema = z.object({
  name:                  z.string().min(2, 'Name must be at least 2 characters'),
  email:                 z.string().email('Invalid email'),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  phone:                 z.string().optional(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const { apiError, success }      = useToast();
  const navigate                   = useNavigate();
  const { t }                      = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      success(t('auth.register.success'));
      navigate('/client/dashboard', { replace: true });
    } catch (err) { apiError(err); } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('auth.register.title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('auth.register.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">{t('auth.register.fullName')}</label>
          <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} placeholder={t('auth.register.fullNamePlaceholder')} />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">{t('auth.login.email')}</label>
          <input type="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} placeholder={t('auth.login.emailPlaceholder')} />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">{t('auth.register.phone')}</label>
          <input {...register('phone')} className="input" placeholder={t('auth.register.phonePlaceholder')} />
        </div>
        <div>
          <label className="label">{t('auth.register.password')}</label>
          <input type="password" {...register('password')} className={`input ${errors.password ? 'input-error' : ''}`} placeholder={t('auth.register.passwordPlaceholder')} />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">{t('auth.register.confirmPassword')}</label>
          <input type="password" {...register('password_confirmation')} className={`input ${errors.password_confirmation ? 'input-error' : ''}`} placeholder={t('auth.register.confirmPlaceholder')} />
          {errors.password_confirmation && <p className="error-text">{errors.password_confirmation.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base mt-2">
          {loading ? <LoadingSpinner size="sm" /> : t('auth.register.createAccount')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
        {t('auth.register.haveAccount')}{' '}
        <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">{t('auth.register.signIn')}</Link>
      </p>
    </AuthLayout>
  );
}
