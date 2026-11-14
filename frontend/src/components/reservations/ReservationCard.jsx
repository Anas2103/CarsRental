import { CalendarDays, Car, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, statusBadgeClass } from '../../utils/helpers';

export default function ReservationCard({ reservation, actions }) {
  const { vehicle, start_date, end_date, total_days, total_price, status } = reservation;
  const { t } = useTranslation();

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {vehicle?.brand} {vehicle?.model}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{vehicle?.category}</p>
        </div>
        <span className={statusBadgeClass(status)}>{status}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{t('reservations.client.pickup')}</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(start_date)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{t('reservations.client.return')}</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(end_date)}</p>
        </div>
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{t('reservations.client.duration')}</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">{total_days} {total_days !== 1 ? t('vehicles.browse.days_plural', { count: total_days }).replace(`${total_days} `, '') : t('vehicles.browse.days', { count: total_days }).replace(`${total_days} `, '')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(total_price)}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{t('reservations.client.total')}</span>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
