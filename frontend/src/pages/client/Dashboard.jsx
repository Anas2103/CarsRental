import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Car, DollarSign, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dashboardService from '../../services/dashboardService';
import ClientLayout from '../../layouts/ClientLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReservationCard from '../../components/reservations/ReservationCard';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/helpers';

function StatBadge({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { user }              = useAuth();
  const { t }                 = useTranslation();

  useEffect(() => {
    dashboardService.client().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <ClientLayout><LoadingSpinner size="lg" className="mt-20" /></ClientLayout>;

  return (
    <ClientLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('clientDashboard.welcome', { name: user?.name?.split(' ')[0] })}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('clientDashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBadge icon={CalendarDays} label={t('clientDashboard.totalReservations')} value={data?.reservations?.total ?? 0}  color="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" />
        <StatBadge icon={Clock}        label={t('clientDashboard.activeBookings')}    value={data?.reservations?.active ?? 0} color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <StatBadge icon={Car}          label={t('clientDashboard.completed')}          value={data?.reservations?.paid ?? 0}   color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        <StatBadge icon={DollarSign}   label={t('clientDashboard.totalSpent')}        value={formatCurrency(data?.total_spent ?? 0)} color="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('clientDashboard.recentReservations')}</h2>
        <Link to="/client/reservations" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">{t('clientDashboard.viewAll')}</Link>
      </div>

      {data?.recent_reservations?.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {data.recent_reservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
        </div>
      ) : (
        <div className="card p-10 text-center mb-6">
          <p className="text-gray-400 dark:text-gray-500 mb-4">{t('clientDashboard.noReservations')}</p>
          <Link to="/client/vehicles" className="btn-primary">{t('clientDashboard.browseVehicles')}</Link>
        </div>
      )}

      <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
        <h3 className="text-lg font-semibold mb-1">{t('clientDashboard.nextTrip')}</h3>
        <p className="text-primary-100 text-sm mb-4">{t('clientDashboard.fleetDesc')}</p>
        <Link to="/client/vehicles" className="inline-block bg-white text-primary-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
          {t('clientDashboard.browseFleet')}
        </Link>
      </div>
    </ClientLayout>
  );
}
