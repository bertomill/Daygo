'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Save, Play, Trash2, X, Star } from 'lucide-react'
import type { ScheduleTemplate, ScheduleEvent } from '@/lib/types/database'

interface ScheduleTemplatesProps {
  templates: ScheduleTemplate[]
  currentEvents: ScheduleEvent[]
  onSaveTemplate: (name: string, description?: string) => void
  onApplyTemplate: (template: ScheduleTemplate) => void
  onDeleteTemplate: (templateId: string) => void
  isSaving?: boolean
}

export function ScheduleTemplates({
  templates,
  currentEvents,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  isSaving,
}: ScheduleTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  const handleSave = () => {
    if (!templateName.trim()) return
    onSaveTemplate(templateName.trim(), templateDescription.trim() || undefined)
    setTemplateName('')
    setTemplateDescription('')
    setShowSaveModal(false)
  }

  const formatEventCount = (template: ScheduleTemplate) => {
    const events = template.template_data as any[]
    return events?.length || 0
  }

  const hasEvents = currentEvents.length > 0

  return (
    <>
      <div className="mb-4 space-y-2">
        {/* Save Current Schedule Button */}
        {hasEvents && (
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            <Star className="w-4 h-4" />
            Save This Schedule
          </button>
        )}

        {/* Templates List Header */}
        {templates.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Saved Schedules
              </span>
              <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                {templates.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {isExpanded ? 'Hide' : 'Show'}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>
        )}

        {/* Templates List */}
        {isExpanded && templates.length > 0 && (
          <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 rounded-lg"
              >
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {template.name}
                  </h4>
                  {template.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                    {formatEventCount(template)} events
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onApplyTemplate(template)}
                    className="p-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors"
                    title="Apply this schedule"
                  >
                    <Play className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Save Schedule Template
              </h2>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Perfect Monday, Deep Work Day..."
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="What makes this schedule special?"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!templateName.trim() || isSaving}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
