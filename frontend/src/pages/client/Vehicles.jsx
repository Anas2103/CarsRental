import { useEffect, useState, useCallback } from 'react';
import { Car, Search, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import vehicleService from '../../services/vehicleService';
import reservationService from '../../services/reservationService';
import ClientLayout from '../../layouts/ClientLayout';
import VehicleCard from '../../components/vehicles/VehicleCard';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, calcDays } from '../../utils/helpers';
import { VEHICLE_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES } from '../../utils/constants';

function BookingModal({ vehicle, isOpen, onClose }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [available, setAvailable] = useState(null);
  const [checking, setChecking]   = useState(false);
  const [booking, setBooking]     = useState(false);
  const { success, apiError }     = useToast();
  const navigate                  = useNavigate();
  const { t }                     = useTranslation();

  const days = calcDays(startDate, endDate);

  const checkAvail = useCallback(async () => {
    if (!vehicle || !startDate || !endDate) return;
    setChecking(true);
    try {
      const r = await reservationService.checkAvailability({ vehicle_id: vehicle.id, start_date: startDate, end_date: endDate });
      setAvailable(r.data.data.available);
    } catch { setAvailable(null); } finally { setChecking(false); }
  }, [vehicle, startDate, endDate]);

  useEffect(() => { if (startDate && endDate) checkAvail(); }, [startDate, endDate]);

  const handleBook = async () => {
    setBooking(true);
    try {
      await reservationService.create({ vehicle_id: vehicle.id, start_date: startDate, end_date: endDate });
      success(t('vehicles.browse.reservationCreated'));
      onClose();
      navigate('/client/reservations');
    } catch (err) { apiError(err); } finally { setBooking(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('vehicles.browse.bookTitle', { brand: vehicle?.brand, model: vehicle?.model })}>
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">{t('vehicles.browse.pricePerDay')}</span>
          <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">{formatCurrency(vehicle?.price_per_day)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('vehicles.browse.pickupDate')}</label>
            <input type="date" min={today} value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{t('vehicles.browse.returnDate')}</label>
            <input type="date" min={startDate || today} value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
          </div>
        </div>

        {checking && <LoadingSpinner size="sm" />}
        {available === true && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">✓ {t('vehicles.browse.isAvailable')}</div>
        )}
        {available === false && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">✗ {t('vehicles.browse.notAvailable')}</div>
        )}

        {days > 0 && available !== false && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">{days} {days !== 1 ? t('vehicles.browse.days_plural', { count: days }).replace(`${days} `, '') : t('vehicles.browse.days', { count: days }).replace(`${days} `, '')} × {formatCurrency(vehicle?.price_per_day)}</span>
              <span className="font-bold text-primary-700 dark:text-primary-300">{formatCurrency(days * (vehicle?.price_per_day || 0))}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg p-3">
          {t('vehicles.browse.paymentNote')}
        </p>

        <button
          onClick={handleBook}
          disabled={booking || !startDate || !endDate || days < 1 || available === false}
          className="btn-primary w-full py-2.5"
        >
          {booking ? t('vehicles.browse.creating') : t('vehicles.browse.reserve', { price: formatCurrency(days * (vehicle?.price_per_day || 0)) })}
        </button>
      </div>
    </Modal>
  );
}

export default function ClientVehicles() {
  const [vehicles, setVehicles]         = useState([]);
  const [meta, setMeta]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [filters, setFilters]           = useState({ search: '', category: '', transmission: '', fuel_type: '', min_price: '', max_price: '' });
  const [page, setPage]                 = useState(1);
  const [showFilters, setShowFilters]   = useState(false);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const { apiError }                    = useToast();
  const { t }                           = useTranslation();

  const load = useCallback(() => {
    setLoading(true);
    const params = { ...filters, page };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    vehicleService.list({ ...params, is_available: 1 }).then(r => {
      setVehicles(r.data.data);
      setMeta(r.data.meta);
    }).catch(apiError).finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ search: '', category: '', transmission: '', fuel_type: '', min_price: '', max_price: '' }); setPage(1); };

  return (
    <ClientLayout>
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">{t('vehicles.browse.title')}</h1><p className="page-subtitle">{t('vehicles.browse.subtitle')}</p></div>
        <button onClick={() => setShowFilters(f => !f)} className="btn-secondary">
          <SlidersHorizontal className="w-4 h-4" /> {t('vehicles.browse.filters')}
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder={t('vehicles.browse.searchPlaceholder')} className="input pl-9 max-w-md" />
      </div>

      {showFilters && (
        <div className="card p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input">
            <option value="">{t('vehicles.browse.allCategories')}</option>
            {VEHICLE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filters.transmission} onChange={e => setFilter('transmission', e.target.value)} className="input">
            <option value="">{t('vehicles.browse.anyTransmission')}</option>
            {TRANSMISSION_TYPES.map(t2 => <option key={t2.value} value={t2.value}>{t2.label}</option>)}
          </select>
          <select value={filters.fuel_type} onChange={e => setFilter('fuel_type', e.target.value)} className="input">
            <option value="">{t('vehicles.browse.anyFuel')}</option>
            {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <input type="number" placeholder={t('vehicles.browse.minPrice')} value={filters.min_price} onChange={e => setFilter('min_price', e.target.value)} className="input" />
          <input type="number" placeholder={t('vehicles.browse.maxPrice')} value={filters.max_price} onChange={e => setFilter('max_price', e.target.value)} className="input" />
          <button onClick={clearFilters} className="btn-ghost"><X className="w-4 h-4" /> {t('vehicles.browse.clear')}</button>
        </div>
      )}

      {loading ? <LoadingSpinner size="lg" className="mt-20" /> : (
        <>
          {vehicles.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <Car className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>{t('vehicles.browse.noResults')}</p>
              <button onClick={clearFilters} className="btn-secondary mt-3">{t('vehicles.browse.clearFilters')}</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vehicles.map(v => (
                <VehicleCard key={v.id} vehicle={v} actions={
                  <button onClick={() => setBookingVehicle(v)} className="btn-primary w-full">
                    {t('vehicles.browse.bookNow')}
                  </button>
                } />
              ))}
            </div>
          )}
          <div className="mt-4 card"><Pagination meta={meta} onPageChange={setPage} /></div>
        </>
      )}

      <BookingModal vehicle={bookingVehicle} isOpen={!!bookingVehicle} onClose={() => setBookingVehicle(null)} />
    </ClientLayout>
  );
}
