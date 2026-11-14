import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import userService from '../../services/userService';
import AdminLayout from '../../layouts/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { formatDate, roleBadgeClass } from '../../utils/helpers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.string().min(1),
  phone:    z.string().optional(),
});

const editSchema = z.object({
  name:      z.string().min(2).optional(),
  email:     z.string().email().optional(),
  role:      z.string().optional(),
  phone:     z.string().optional(),
  is_active: z.boolean().optional(),
});

function UserForm({ onSubmit, defaultValues = {}, loading, submitLabel, schema }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('common.name')}</label>
          <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`} />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">{t('common.email')}</label>
          <input type="email" {...register('email')} className={`input ${errors.email ? 'input-error' : ''}`} />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
      </div>
      {schema === createSchema && (
        <div>
          <label className="label">{t('users.password')}</label>
          <input type="password" {...register('password')} className={`input ${errors.password ? 'input-error' : ''}`} />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('common.role')}</label>
          <select {...register('role')} className="input">
            <option value="client">{t('users.roles.client')}</option>
            <option value="manager">{t('users.roles.manager')}</option>
            <option value="admin">{t('users.roles.admin')}</option>
            <option value="super-admin">{t('users.roles.superAdmin')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('common.phone')}</label>
          <input {...register('phone')} className="input" />
        </div>
      </div>
      {schema === editSchema && (
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" {...register('is_active')} className="rounded dark:accent-primary-500" />
          <label htmlFor="is_active" className="text-sm dark:text-gray-300">{t('users.active')}</label>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}

export default function AdminUsers() {
  const [users, setUsers]               = useState([]);
  const [meta, setMeta]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [createOpen, setCreateOpen]     = useState(false);
  const [editUser, setEditUser]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const { success, apiError }           = useToast();
  const { t }                           = useTranslation();

  const load = useCallback(() => {
    setLoading(true);
    userService.list({ search, page }).then(r => {
      setUsers(r.data.data);
      setMeta(r.data.meta);
    }).catch(apiError).finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try { await userService.create(data); success(t('users.created')); setCreateOpen(false); load(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const handleEdit = async (data) => {
    setSubmitting(true);
    try { await userService.update(editUser.id, data); success(t('users.updated')); setEditUser(null); load(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try { await userService.delete(deleteTarget.id); success(t('users.deleted')); setDeleteTarget(null); load(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const toggleStatus = async (user) => {
    try { await userService.toggleStatus(user.id); success(t('users.statusUpdated')); load(); }
    catch (err) { apiError(err); }
  };

  return (
    <AdminLayout>
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">{t('users.title')}</h1><p className="page-subtitle">{t('users.subtitle')}</p></div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> {t('users.addUser')}</button>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t('users.searchPlaceholder')} className="input pl-9" />
          </div>
        </div>

        {loading ? <LoadingSpinner className="py-12" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('users.user')}</th>
                    <th>{t('common.role')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.joined')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 dark:text-gray-500">{t('users.noUsers')}</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-semibold flex items-center justify-center">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className={roleBadgeClass(u.roles?.[0]?.name)}>{u.roles?.[0]?.name ?? '—'}</span></td>
                      <td>
                        <span className={u.is_active ? 'badge-available' : 'badge-unavailable'}>
                          {u.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => setEditUser(u)} className="btn-ghost p-1.5 text-primary-600 dark:text-primary-400"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => toggleStatus(u)} className={`btn-ghost p-1.5 ${u.is_active ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setDeleteTarget(u)} className="btn-ghost p-1.5 text-red-600 dark:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('users.addUser')}>
        <UserForm onSubmit={handleCreate} loading={submitting} submitLabel={t('users.createUser')} schema={createSchema} />
      </Modal>
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={t('users.editUser')}>
        {editUser && <UserForm onSubmit={handleEdit} loading={submitting} defaultValues={{ ...editUser, role: editUser.roles?.[0]?.name, is_active: editUser.is_active }} submitLabel={t('users.updateUser')} schema={editSchema} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={submitting}
        title={t('users.deleteUser')} message={t('users.deleteConfirm', { name: deleteTarget?.name })} />
    </AdminLayout>
  );
}
