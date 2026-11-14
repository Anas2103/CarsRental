import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import reservationService from '../../services/reservationService';
import AdminLayout from '../../layouts/AdminLayout';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, statusBadgeClass } from '../../utils/helpers';

export default function AdminReservations() {
  const [reservations, setReservations]   = useState([]);
  const [meta, setMeta]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('');
  const [page, setPage]                   = useState(1);
  const [selected, setSelected]           = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const { success, apiError }             = useToast();
  const { t }                             = useTranslation();

  const load = useCallback(() => {
    setLoading(true);
    const params = { page };
    if (filter) params.status = filter;
    reservationService.list(params).then(r => {
      setReservations(r.data.data);
      setMeta(r.data.meta);
    }).catch(apiError).finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try { await reservationService.confirm(confirmAction.id); success(t('reservations.admin.confirmed')); setConfirmAction(null); load(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    setSubmitting(true);
    try { await reservationService.cancel(confirmAction.id, 'Cancelled by admin'); success(t('reservations.admin.cancelled')); setConfirmAction(null); load(); }
    catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const STATUSES = ['', 'pending', 'confirmed', 'paid', 'cancelled'];

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">{t('reservations.admin.title')}</h1>
        <p className="page-subtitle">{t('reservations.admin.subtitle')}</p>
      </div>

      <div className="table-wrapper">
        <div className="table-header gap-3 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map(s => (
              <button key={s || 'all'} onClick={() => { setFilter(s); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {s || t('common.all')}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-ghost ml-auto"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {loading ? <LoadingSpinner className="py-12" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('reservations.admin.client')}</th>
                    <th>{t('reservations.admin.vehicle')}</th>
                    <th>{t('reservations.admin.dates')}</th>
                    <th>{t('reservations.admin.total')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 dark:text-gray-500">{t('reservations.admin.noReservations')}</td></tr>
                  ) : reservations.map(r => (
                    <tr key={r.id}>
                      <td className="text-gray-400 dark:text-gray-500">#{r.id}</td>
                      <td>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{r.user?.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{r.user?.email}</p>
                      </td>
                      <td>{r.vehicle?.brand} {r.vehicle?.model}</td>
                      <td className="text-xs">
                        <p>{formatDate(r.start_date)}</p>
                        <p className="text-gray-400 dark:text-gray-500">→ {formatDate(r.end_date)}</p>
                      </td>
                      <td className="font-semibold">{formatCurrency(r.total_price)}</td>
                      <td><span className={statusBadgeClass(r.status)}>{r.status}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => setSelected(r)} className="btn-ghost p-1.5 text-primary-600 dark:text-primary-400">
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === 'pending' && (
                            <>
                              <button onClick={() => setConfirmAction({ ...r, _action: 'confirm' })} className="btn-ghost p-1.5 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmAction({ ...r, _action: 'cancel' })} className="btn-ghost p-1.5 text-red-600 dark:text-red-400">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={t('reservations.admin.reservationId', { id: selected?.id })}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.client')}</p><p className="font-medium dark:text-gray-200">{selected.user?.name}</p></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.vehicle')}</p><p className="font-medium dark:text-gray-200">{selected.vehicle?.brand} {selected.vehicle?.model}</p></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.pickup')}</p><p className="font-medium dark:text-gray-200">{formatDate(selected.start_date)}</p></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.return')}</p><p className="font-medium dark:text-gray-200">{formatDate(selected.end_date)}</p></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.duration')}</p><p className="font-medium dark:text-gray-200">{selected.total_days} {t('reservations.admin.days')}</p></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.total')}</p><p className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(selected.total_price)}</p></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('common.status')}</p><span className={statusBadgeClass(selected.status)}>{selected.status}</span></div>
              <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.payment')}</p><span className={statusBadgeClass(selected.payment_status)}>{selected.payment_status}</span></div>
            </div>
            {selected.notes && <div><p className="text-gray-400 dark:text-gray-500">{t('reservations.admin.notes')}</p><p className="dark:text-gray-300">{selected.notes}</p></div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?._action === 'confirm' ? handleConfirm : handleCancel}
        loading={submitting}
        title={confirmAction?._action === 'confirm' ? t('reservations.admin.confirmTitle') : t('reservations.admin.cancelTitle')}
        message={t('reservations.admin.confirmMsg', { action: confirmAction?._action, id: confirmAction?.id })}
        confirmLabel={confirmAction?._action === 'confirm' ? t('reservations.admin.confirmBtn') : t('reservations.admin.cancelBtn')}
        variant={confirmAction?._action === 'confirm' ? 'primary' : 'danger'}
      />
    </AdminLayout>
  );
}
