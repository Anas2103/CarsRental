import { Navigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PageLoader } from '../components/common/LoadingSpinner';
import { ROLES } from '../utils/constants';

export default function AuthLayout({ children }) {
  const { user, loading } = useAuth();
  const { dark, toggle } = useTheme();
  const { t, i18n } = useTranslation();
  if (loading) return <PageLoader />;

  if (user) {
    const role = user?.roles?.[0]?.name;
    if (role === ROLES.CLIENT) return <Navigate to="/client/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';
  const toggleLang = () => {
    const next = currentLang === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm transition-colors text-xs font-bold w-8 h-8 flex items-center justify-center"
          title={currentLang === 'en' ? 'Passer en français' : 'Switch to English'}
        >
          {currentLang === 'en' ? t('common.switchToFrench') : t('common.switchToEnglish')}
        </button>
        <button
          onClick={toggle}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm transition-colors"
          title={dark ? t('common.switchLight') : t('common.switchDark')}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🚗</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">CarsRental</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.subtitle')}</p>
        </div>
        <div className="card p-8 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
