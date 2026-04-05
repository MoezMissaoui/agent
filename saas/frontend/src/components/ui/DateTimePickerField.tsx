import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';

type Props = {
  id?: string;
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
};

export function DateTimePickerField({ id, label, value, onChange }: Props) {
  const isFr =
    typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr');

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <DatePicker
        id={id}
        selected={value}
        onChange={(d: Date | null) => onChange(d)}
        showTimeSelect
        timeIntervals={15}
        timeCaption={isFr ? 'Heure' : 'Time'}
        dateFormat="MMM d, yyyy h:mm aa"
        isClearable
        placeholderText={isFr ? 'Date et heure' : 'Date and time'}
        popperProps={{ strategy: 'fixed' }}
        className={inputClassName}
        wrapperClassName="w-full block"
      />
    </div>
  );
}
