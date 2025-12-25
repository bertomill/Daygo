'use client'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  label?: string
  minTime?: string
}

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
      options.push({ value, label })
    }
  }

  return options
}

const TIME_OPTIONS = generateTimeOptions()

export function TimePicker({ value, onChange, label, minTime }: TimePickerProps) {
  const availableOptions = minTime
    ? TIME_OPTIONS.filter((opt) => opt.value > minTime)
    : TIME_OPTIONS

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-schedule"
      >
        {availableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
