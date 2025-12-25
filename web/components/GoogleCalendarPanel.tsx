'use client'

import { useState } from 'react'
import { Calendar, Check, ExternalLink, RefreshCw, Unlink } from 'lucide-react'

interface GoogleCalendarPanelProps {
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
  onImportEvents: () => void
  onExportEvents: () => void
  isImporting: boolean
  isExporting: boolean
}

export function GoogleCalendarPanel({
  isConnected,
  onConnect,
  onDisconnect,
  onImportEvents,
  onExportEvents,
  isImporting,
  isExporting,
}: GoogleCalendarPanelProps) {
  const [showOptions, setShowOptions] = useState(false)

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="w-full flex items-center justify-center gap-2 p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors mb-2"
      >
        <Calendar className="w-4 h-4" />
        Connect Google Calendar
        <ExternalLink className="w-3 h-3 opacity-50" />
      </button>
    )
  }

  return (
    <div className="mb-2 space-y-2">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Google Calendar
          </span>
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full">
            <Check className="w-3 h-3" />
            Connected
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {showOptions ? 'Hide' : 'Options'}
        </span>
      </button>

      {showOptions && (
        <div className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl space-y-2">
          <div className="flex gap-2">
            <button
              onClick={onImportEvents}
              disabled={isImporting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isImporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isImporting ? 'Importing...' : 'Import Events'}
            </button>
            <button
              onClick={onExportEvents}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export to GCal'}
            </button>
          </div>
          <button
            onClick={onDisconnect}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 text-sm rounded-lg transition-colors"
          >
            <Unlink className="w-4 h-4" />
            Disconnect
          </button>
          <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
            Import pulls events from Google Calendar. Export pushes your schedule to Google Calendar.
          </p>
        </div>
      )}
    </div>
  )
}
