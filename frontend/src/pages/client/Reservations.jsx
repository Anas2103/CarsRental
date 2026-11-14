import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CreditCard, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import reservationService from '../../services/reservationService';
import paymentService from '../../services/paymentService';
import ClientLayout from '../../layouts/ClientLayout';
import ReservationCard from '../../components/reservations/ReservationCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/helpers';

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
}

function CardForm({ amount, onPay, onBack, paying }) {
  const [card, setCard]     = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});
  const { t }               = useTranslation();

  const validate = () => {
    const e = {};
    if (!card.name.trim())                             e.name   = 'Name is required';
    if (card.number.replace(/\s/g, '').length !== 16) e.number = 'Enter a 16-digit card number';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry))          e.expiry = 'Use MM/YY format';
    if (!/^\d{3,4}$/.test(card.cvv))                  e.cvv    = 'CVV must be 3–4 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (validate()) onPay(); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{t('reservations.payment.amountDue')}</span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white space-y-3">
        <p className="text-xs opacity-70 uppercase tracking-widest">{t('reservations.payment.cardPreview')}</p>
        <p className="font-mono text-lg tracking-widest">{(card.number || '•••• •••• •••• ••••')}</p>
        <div className="flex justify-between text-sm">
          <span>{card.name || 'CARDHOLDER NAME'}</span>
          <span>{card.expiry || 'MM/YY'}</span>
        </div>
      </div>

      <div>
        <label className="label">{t('reservations.payment.cardholderName')}</label>
        <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="John Doe"
          value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} />
        {errors.name && <p className="error-text">{errors.name}</p>}
      </div>

      <div>
        <label className="label">{t('reservations.payment.cardNumber')}</label>
        <input className={`input font-mono ${errors.number ? 'input-error' : ''}`} placeholder="1234 5678 9012 3456"
          value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))} />
        {errors.number && <p className="error-text">{errors.number}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('reservations.payment.expiry')}</label>
          <input className={`input ${errors.expiry ? 'input-error' : ''}`} placeholder="MM/YY"
            value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))} />
          {errors.expiry && <p className="error-text">{errors.expiry}</p>}
        </div>
        <div>
          <label className="label">{t('reservations.payment.cvv')}</label>
          <input type="password" maxLength={4} className={`input ${errors.cvv ? 'input-error' : ''}`} placeholder="•••"
            value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
          {errors.cvv && <p className="error-text">{errors.cvv}</p>}
        </div>
      </div>

      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg p-2">
        {t('reservations.payment.testEnv')}
      </p>

      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">{t('common.back')}</button>
        <button type="submit" disabled={paying} className="btn-primary flex-1">
          {paying ? <LoadingSpinner size="sm" /> : t('reservations.payment.pay', { amount: formatCurrency(amount) })}
        </button>
      </div>
    </form>
  );
}

function PaymentModal({ reservation, onClose, onPaid }) {
  const [step, setStep]     = useState('choose');
  const [paying, setPaying] = useState(false);
  const { success, apiError } = useToast();
  const { t }               = useTranslation();

  const handleClose = () => { setStep('choose'); onClose(); };

  const payMock = async () => {
    setPaying(true);
    try {
      await paymentService.mockPay(reservation.id);
      success(t('reservations.payment.processed'));
      setStep('choose');
      onPaid();
    } catch (err) { apiError(err); } finally { setPaying(false); }
  };

  const payPaypal = async () => {
    setPaying(true);
    try {
      const res = await paymentService.createPaypalOrder(reservation.id);
      window.open(res.data.data.approve_url, '_blank');
      success(t('reservations.payment.paypalOpened'));
      handleClose();
    } catch (err) { apiError(err); } finally { setPaying(false); }
  };

  return (
    <Modal isOpen={!!reservation} onClose={handleClose}
      title={step === 'card' ? t('reservations.payment.cardDetails') : t('reservations.payment.chooseMethod')} size="sm">
      {step === 'choose' ? (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t('reservations.payment.amountDue')}</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(reservation?.total_price)}</span>
          </div>

          <button onClick={() => setStep('card')} disabled={paying}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-500 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 text-left">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('reservations.payment.creditCard')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('reservations.payment.creditCardDesc')}</p>
            </div>
            <span className="text-gray-400 dark:text-gray-500 text-lg">›</span>
          </button>

          <button onClick={payPaypal} disabled={paying}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-500 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 text-left">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Landmark className="w-5 h-5 text-primary-700 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('reservations.payment.paypal')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('reservations.payment.paypalDesc')}</p>
            </div>
            {paying ? <LoadingSpinner size="sm" /> : <span className="text-gray-400 dark:text-gray-500 text-lg">›</span>}
          </button>
        </div>
      ) : (
        <CardForm amount={reservation?.total_price} onPay={payMock} onBack={() => setStep('choose')} paying={paying} />
      )}
    </Modal>
  );
}

export default function ClientReservations() {
  const [reservations, setReservations] = useState([]);
  const [meta, setMeta]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('');
  const [page, setPage]                 = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [payTarget, setPayTarget]       = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const { success, apiError }           = useToast();
  const { t }                           = useTranslation();

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

  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await reservationService.cancel(cancelTarget.id, 'Client requested cancellation');
      success(t('reservations.client.cancelled'));
      setCancelTarget(null);
      load();
    } catch (err) { apiError(err); } finally { setSubmitting(false); }
  };

  const STATUSES = ['', 'pending', 'confirmed', 'paid', 'cancelled'];

  return (
    <ClientLayout>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('reservations.client.title')}</h1>
          <p className="page-subtitle">{t('reservations.client.subtitle')}</p>
        </div>
        <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /> {t('common.refresh')}</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s => (
          <button key={s || 'all'} onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}>
            {s || t('common.all')}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner size="lg" className="mt-16" /> : (
        reservations.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p>{t('reservations.client.noReservations')}</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map(r => (
                <ReservationCard key={r.id} reservation={r} actions={
                  <>
                    {(r.status === 'pending' || r.status === 'confirmed') && r.payment_status !== 'paid' && (
                      <button onClick={() => setPayTarget(r)} className="btn-success flex-1 text-xs py-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> {t('reservations.client.payNow')}
                      </button>
                    )}
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button onClick={() => setCancelTarget(r)} className="btn-danger flex-1 text-xs py-1.5">
                        {t('reservations.client.cancel')}
                      </button>
                    )}
                  </>
                } />
              ))}
            </div>
            <div className="mt-4 card"><Pagination meta={meta} onPageChange={setPage} /></div>
          </>
        )
      )}

      <PaymentModal reservation={payTarget} onClose={() => setPayTarget(null)} onPaid={() => { setPayTarget(null); load(); }} />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={submitting}
        title={t('reservations.client.cancelTitle')}
        message={t('reservations.client.cancelConfirm')}
        confirmLabel={t('reservations.client.yesCancel')}
      />
    </ClientLayout>
  );
}
