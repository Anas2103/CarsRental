import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { VEHICLE_CATEGORIES, TRANSMISSION_TYPES, FUEL_TYPES } from '../../utils/constants';
import { getImageUrl } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

const optionalInt = (min, max) =>
  z.preprocess(
    v => (v === '' || v === null || v === undefined) ? undefined : Number(v),
    z.number().int().min(min).max(max).optional().nullable()
  );

const schema = z.object({
  brand:         z.string().min(1, 'Brand is required'),
  model:         z.string().min(1, 'Model is required'),
  category:      z.string().min(1, 'Category is required'),
  transmission:  z.string().min(1, 'Transmission is required'),
  fuel_type:     z.string().min(1, 'Fuel type is required'),
  price_per_day: z.coerce.number().min(1, 'Price must be at least $1'),
  year:          optionalInt(1990, new Date().getFullYear() + 1),
  seats:         optionalInt(1, 20),
  color:         z.string().optional(),
  license_plate: z.string().optional(),
  description:   z.string().optional(),
  is_available:  z.boolean().optional(),
});

export default function VehicleForm({ onSubmit, defaultValues = {}, loading = false, submitLabel }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { is_available: true, seats: 5, ...defaultValues },
  });

  const imageRef    = useRef(null);
  const [preview, setPreview] = useState(null);
  const existingImg = getImageUrl(defaultValues?.image);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') return;
      formData.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : v);
    });
    if (imageRef.current?.files?.[0]) {
      formData.append('image', imageRef.current.files[0]);
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('vehicles.form.brand')}</label>
          <input {...register('brand')} className={`input ${errors.brand ? 'input-error' : ''}`} placeholder={t('vehicles.form.brandPlaceholder')} />
          {errors.brand && <p className="error-text">{errors.brand.message}</p>}
        </div>
        <div>
          <label className="label">{t('vehicles.form.model')}</label>
          <input {...register('model')} className={`input ${errors.model ? 'input-error' : ''}`} placeholder={t('vehicles.form.modelPlaceholder')} />
          {errors.model && <p className="error-text">{errors.model.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('vehicles.form.category')}</label>
          <select {...register('category')} className={`input ${errors.category ? 'input-error' : ''}`}>
            <option value="">{t('vehicles.form.selectCategory')}</option>
            {VEHICLE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.category && <p className="error-text">{errors.category.message}</p>}
        </div>
        <div>
          <label className="label">{t('vehicles.form.transmission')}</label>
          <select {...register('transmission')} className={`input ${errors.transmission ? 'input-error' : ''}`}>
            <option value="">{t('vehicles.form.selectTransmission')}</option>
            {TRANSMISSION_TYPES.map(t2 => <option key={t2.value} value={t2.value}>{t2.label}</option>)}
          </select>
          {errors.transmission && <p className="error-text">{errors.transmission.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">{t('vehicles.form.fuelType')}</label>
          <select {...register('fuel_type')} className={`input ${errors.fuel_type ? 'input-error' : ''}`}>
            <option value="">{t('vehicles.form.selectFuel')}</option>
            {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          {errors.fuel_type && <p className="error-text">{errors.fuel_type.message}</p>}
        </div>
        <div>
          <label className="label">{t('vehicles.form.pricePerDay')}</label>
          <input type="number" step="0.01" {...register('price_per_day')} className={`input ${errors.price_per_day ? 'input-error' : ''}`} />
          {errors.price_per_day && <p className="error-text">{errors.price_per_day.message}</p>}
        </div>
        <div>
          <label className="label">{t('vehicles.form.year')}</label>
          <input type="number" {...register('year')} className={`input ${errors.year ? 'input-error' : ''}`} placeholder={t('vehicles.form.yearPlaceholder')} />
          {errors.year && <p className="error-text">{errors.year.message || t('vehicles.form.yearError', { max: new Date().getFullYear() + 1 })}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">{t('vehicles.form.seats')}</label>
          <input type="number" {...register('seats')} className="input" />
        </div>
        <div>
          <label className="label">{t('vehicles.form.color')}</label>
          <input {...register('color')} className="input" placeholder={t('vehicles.form.colorPlaceholder')} />
        </div>
        <div>
          <label className="label">{t('vehicles.form.licensePlate')}</label>
          <input {...register('license_plate')} className="input" placeholder={t('vehicles.form.licensePlaceholder')} />
        </div>
      </div>

      <div>
        <label className="label">{t('vehicles.form.description')}</label>
        <textarea {...register('description')} rows={3} className="input resize-none" placeholder={t('vehicles.form.descriptionPlaceholder')} />
      </div>

      <div>
        <label className="label">{t('vehicles.form.image')}</label>
        {(preview || existingImg) && (
          <div className="mb-2 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img src={preview || existingImg} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <input
          ref={imageRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="input py-1.5 cursor-pointer"
          onChange={handleImageChange}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('vehicles.form.imageHint')}</p>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_available" {...register('is_available')} className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:bg-gray-700" />
        <label htmlFor="is_available" className="text-sm text-gray-700 dark:text-gray-300">{t('vehicles.form.availableForRental')}</label>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
        {loading ? <LoadingSpinner size="sm" /> : (submitLabel || t('vehicles.form.save'))}
      </button>
    </form>
  );
}
