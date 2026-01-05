'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Sparkles, RefreshCw, Wand2, Eye } from 'lucide-react'
import type { CalendarRule } from '@/lib/types/database'

interface CalendarRulesPanelProps {
  rules: CalendarRule[]
  onAddRule: (ruleText: string) => void
  onToggleRule: (ruleId: string, isActive: boolean) => void
  onDeleteRule: (ruleId: string) => void
  onApplyRules: () => void
  onClearAiEvents: () => void
  onSeePrompt: () => void
  isApplying: boolean
  hasAiEvents: boolean
  planningStatus?: string
}

export function CalendarRulesPanel({
  rules,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onApplyRules,
  onClearAiEvents,
  onSeePrompt,
  isApplying,
  hasAiEvents,
  planningStatus,
}: CalendarRulesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newRuleText, setNewRuleText] = useState('')

  const handleAddRule = () => {
    if (!newRuleText.trim()) return
    onAddRule(newRuleText.trim())
    setNewRuleText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddRule()
    }
  }

  const activeRulesCount = rules.filter(r => r.is_active).length

  return (
    <>
      {/* Floating Planning Status Indicator - Bottom Left */}
      {isApplying && (
        <div className="fixed bottom-24 left-4 z-40 animate-in slide-in-from-left-5 fade-in duration-300">
          <div className="bg-gradient-to-r from-schedule to-emerald-400 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-sm">
            <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Planning your day...</span>
              {planningStatus && (
                <span className="text-xs text-white/80">{planningStatus}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 space-y-2">
        {/* Plan My Day Button - always visible */}
        <div className="flex gap-2">
          <button
            onClick={onApplyRules}
            disabled={isApplying}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-schedule to-emerald-400 hover:from-schedule/90 hover:to-emerald-400/90 disabled:from-schedule/50 disabled:to-emerald-400/50 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Planning...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Plan My Day
              </>
            )}
          </button>
          <button
            onClick={onSeePrompt}
            disabled={isApplying}
            className="px-3 py-2.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            See Prompt
          </button>
          {hasAiEvents && !isApplying && (
            <button
              onClick={onClearAiEvents}
              className="px-3 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Clear AI
            </button>
          )}
        </div>

      {/* Rules Expansion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-schedule" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Scheduling Rules
          </span>
          {activeRulesCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-schedule/10 text-schedule rounded-full">
              {activeRulesCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {isExpanded ? 'Hide' : 'Customize'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-2 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl space-y-3">
          {/* Rules list */}
          {rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    rule.is_active
                      ? 'bg-schedule/5'
                      : 'bg-gray-50 dark:bg-slate-700/30 opacity-60'
                  }`}
                >
                  <button
                    onClick={() => onToggleRule(rule.id, !rule.is_active)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      rule.is_active
                        ? 'border-schedule bg-schedule'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    {rule.is_active && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      rule.is_active
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-slate-400 line-through'
                    }`}
                  >
                    {rule.rule_text}
                  </span>
                  <button
                    onClick={() => onDeleteRule(rule.id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-2">
              No rules yet. Add one below!
            </p>
          )}

          {/* Add new rule input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-schedule"
              placeholder="e.g., Fill empty time with coding..."
            />
            <button
              onClick={handleAddRule}
              disabled={!newRuleText.trim()}
              className="px-3 py-2 bg-schedule hover:bg-schedule/90 disabled:bg-schedule/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Optional: Add rules to customize how AI plans your day. Examples:
            "Block 9-10 AM for deep work", "No meetings before noon",
            "Schedule exercise in the evening"
          </p>
        </div>
      )}
      </div>
    </>
  )
}
