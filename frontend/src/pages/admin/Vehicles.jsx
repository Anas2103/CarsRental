import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import vehicleService from '../../services/vehicleService';
import AdminLayout from '../../layouts/AdminLayout';
import VehicleForm from '../../components/vehicles/VehicleForm';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getImageUrl } from '../../utils/helpers';

export default function AdminVehicles() {
  const [vehicles, setVehicles]         = useState([]);
  const [meta, setMeta]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [createOpen, setCreateOpen]     = useState(false);
  const [editVehicle, setEditVehicle]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const { success, apiError }           = useToast();
  const { t }                           = useTranslation();

  const loadVehicles = useCallback(() => {
    setLoading(true);
    vehicleService.list({ search, page }).then(r => {
      setVehicles(r.data.data);
      setMeta(r.data.meta);
    }).catch(apiError).finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try { await vehicleService.create(formData); success(t('vehicles.admin.created')); setCreateOpen(false); loadVehicles(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    try { await vehicleService.update(editVehicle.id, formData); success(t('vehicles.admin.updated')); setEditVehicle(null); loadVehicles(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try { await vehicleService.delete(deleteTarget.id); success(t('vehicles.admin.deleted')); setDeleteTarget(null); loadVehicles(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  return (
    <AdminLayout>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('vehicles.admin.title')}</h1>
          <p className="page-subtitle">{t('vehicles.admin.subtitle')}</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> {t('vehicles.admin.addVehicle')}
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-header gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('vehicles.admin.searchPlaceholder')} className="input pl-9" />
          </div>
          <button onClick={loadVehicles} className="btn-ghost"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('vehicles.admin.vehicle')}</th>
                    <th>{t('vehicles.admin.category')}</th>
                    <th>{t('vehicles.admin.transmission')}</th>
                    <th>{t('vehicles.admin.fuel')}</th>
                    <th>{t('vehicles.admin.priceDay')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t('vehicles.admin.noVehicles')}</td></tr>
                  ) : vehicles.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {v.image
                              ? <img src={getImageUrl(v.image)} alt="" className="w-full h-full object-cover" />
                              : <span className="flex items-center justify-center h-full text-xl">🚗</span>}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{v.brand} {v.model}</p>
                            <p className="text-xs text-gray-400">{v.year} · {v.seats} {t('vehicles.card.seats')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="capitalize">{v.category}</td>
                      <td className="capitalize">{v.transmission}</td>
                      <td className="capitalize">{v.fuel_type}</td>
                      <td className="font-semibold text-primary-600">{formatCurrency(v.price_per_day)}</td>
                      <td>
                        <span className={v.is_available ? 'badge-available' : 'badge-unavailable'}>
                          {v.is_available ? t('common.available') : t('common.unavailable')}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => setEditVehicle(v)} className="btn-ghost p-1.5 text-primary-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(v)} className="btn-ghost p-1.5 text-red-600"><Trash2 className="w-4 h-4" /></button>
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

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('vehicles.admin.addVehicle')} size="lg">
        <VehicleForm onSubmit={handleCreate} loading={submitting} submitLabel={t('vehicles.admin.createVehicle')} />
      </Modal>

      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title={t('vehicles.admin.editVehicle')} size="lg">
        {editVehicle && (
          <VehicleForm onSubmit={handleUpdate} loading={submitting} defaultValues={editVehicle} submitLabel={t('vehicles.admin.updateVehicle')} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={submitting}
        title={t('vehicles.admin.deleteVehicle')}
        message={t('vehicles.admin.deleteConfirm', { brand: deleteTarget?.brand, model: deleteTarget?.model })}
        confirmLabel={t('common.delete')}
      />
    </AdminLayout>
  );
}
