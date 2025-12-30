import { TimePeriod } from '@/lib/services/analytics'

interface TimePeriodToggleProps {
  selected: TimePeriod
  onChange: (period: TimePeriod) => void
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Days' },
  { value: 'week', label: 'Weeks' },
  { value: 'month', label: 'Months' },
  { value: 'year', label: 'Years' },
]

export function TimePeriodToggle({ selected, onChange }: TimePeriodToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            selected === period.value
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
