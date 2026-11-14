import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';
import api from '../../services/api';
import { getImageUrl, roleBadgeClass } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const profileSchema = z.object({
  name:    z.string().min(2),
  phone:   z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  current_password:      z.string().min(1),
  password:              z.string().min(8),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match', path: ['password_confirmation'],
});

export default function AdminProfile() {
  const { user, updateUser }      = useAuth();
  const { success, apiError }     = useToast();
  const [saving, setSaving]       = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const role                      = user?.roles?.[0]?.name;
  const { t }                     = useTranslation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, phone: user?.phone ?? '', address: user?.address ?? '' },
  });

  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, reset } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSave = async (data) => {
    setSaving(true);
    try { const res = await authService.updateProfile(data); updateUser(res.data.data); success(t('profile.updated')); }
    catch (err) { apiError(err); } finally { setSaving(false); }
  };

  const onPw = async (data) => {
    setPwSaving(true);
    try { await authService.updateProfile(data); success(t('profile.passwordChanged')); reset(); }
    catch (err) { apiError(err); } finally { setPwSaving(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ ...user, avatar: res.data.data.path });
      success(t('profile.avatarUpdated'));
    } catch (err) { apiError(err); } finally { setUploading(false); }
  };

  const avatarUrl = getImageUrl(user?.avatar);

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
        <p className="page-subtitle">{t('profile.adminSubtitle')}</p>
      </div>
      <div className="max-w-2xl space-y-5">
        <div className="card p-6 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 text-2xl font-bold flex items-center justify-center overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : user?.name?.[0]?.toUpperCase()}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm">
              {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-3 h-3 text-gray-600 dark:text-gray-300" />}
              <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
            </label>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className={`mt-1 inline-block ${roleBadgeClass(role)}`}>{role}</span>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('profile.personalInfo')}</h3>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('profile.fullName')}</label>
                <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} />
                {errors.name && <p className="error-text">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">{t('common.phone')}</label>
                <input {...register('phone')} className="input" />
              </div>
            </div>
            <div>
              <label className="label">{t('common.address')}</label>
              <input {...register('address')} className="input" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? t('profile.saving') : t('profile.saveChanges')}</button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('profile.changePassword')}</h3>
          <form onSubmit={handlePw(onPw)} className="space-y-4">
            <div>
              <label className="label">{t('profile.currentPassword')}</label>
              <input type="password" {...regPw('current_password')} className={`input ${pwErrors.current_password ? 'input-error' : ''}`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('profile.newPassword')}</label>
                <input type="password" {...regPw('password')} className={`input ${pwErrors.password ? 'input-error' : ''}`} />
                {pwErrors.password && <p className="error-text">{pwErrors.password.message}</p>}
              </div>
              <div>
                <label className="label">{t('profile.confirm')}</label>
                <input type="password" {...regPw('password_confirmation')} className={`input ${pwErrors.password_confirmation ? 'input-error' : ''}`} />
                {pwErrors.password_confirmation && <p className="error-text">{pwErrors.password_confirmation.message}</p>}
              </div>
            </div>
            <button type="submit" disabled={pwSaving} className="btn-primary">{pwSaving ? t('profile.changing') : t('profile.changePassword')}</button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
