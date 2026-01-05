'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Trash2, Plus, Check, Target } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { kanbanService } from '@/lib/services/kanban'
import { goalsService } from '@/lib/services/goals'
import type { KanbanCardWithDetails } from '@/lib/types/database'

interface KanbanCardModalProps {
  card: KanbanCardWithDetails
  onClose: () => void
}

export function KanbanCardModal({ card, onClose }: KanbanCardModalProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [tags, setTags] = useState<string[]>(card.tags || [])
  const [newTag, setNewTag] = useState('')
  const [highPriority, setHighPriority] = useState(card.high_priority || false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newSubtaskText, setNewSubtaskText] = useState('')

  // Fetch goals and columns for linking/moving
  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => goalsService.getGoals(user!.id),
    enabled: !!user,
  })

  const { data: columns = [] } = useQuery({
    queryKey: ['kanban-columns', user?.id],
    queryFn: () => kanbanService.getColumnsWithCards(user!.id),
    enabled: !!user,
  })

  const updateCardMutation = useMutation({
    mutationFn: async (updates: {
      title?: string
      description?: string
      column_id?: string
      status?: 'todo' | 'in_progress' | 'done'
      tags?: string[]
      high_priority?: boolean
    }) => {
      return kanbanService.updateCard(card.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
    },
  })

  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      return kanbanService.deleteCard(card.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
      onClose()
    },
  })

  const createSubtaskMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) return
      return kanbanService.createSubtask(user.id, card.id, text)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
      setNewSubtaskText('')
    },
  })

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({
      subtaskId,
      completed,
    }: {
      subtaskId: string
      completed: boolean
    }) => {
      return kanbanService.toggleSubtask(subtaskId, completed)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
    },
  })

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      return kanbanService.deleteSubtask(subtaskId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
    },
  })

  const linkGoalMutation = useMutation({
    mutationFn: async (goalId: string | null) => {
      if (goalId) {
        await kanbanService.linkGoal(card.id, goalId)
      } else {
        await kanbanService.unlinkGoal(card.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] })
    },
  })

  const handleUpdateTitle = () => {
    if (title.trim() && title !== card.title) {
      updateCardMutation.mutate({ title: title.trim() })
    }
  }

  const handleUpdateDescription = () => {
    if (description !== card.description) {
      updateCardMutation.mutate({ description: description.trim() })
    }
  }

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      updateCardMutation.mutate({ tags: updatedTags })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove)
    setTags(updatedTags)
    updateCardMutation.mutate({ tags: updatedTags })
  }

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskText.trim()) {
      createSubtaskMutation.mutate(newSubtaskText.trim())
    }
  }

  const handleMoveCard = (
    columnId: string,
    status: 'todo' | 'in_progress' | 'done'
  ) => {
    updateCardMutation.mutate({ column_id: columnId, status })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {showDeleteConfirm ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Card?
              </h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this card?
              {card.subtasks.length > 0 && (
                <>
                  {' '}
                  This will also delete{' '}
                  <span className="font-semibold">
                    {card.subtasks.length} subtasks
                  </span>
                  .
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-5 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCardMutation.mutate()}
                disabled={deleteCardMutation.isPending}
                className="flex-1 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleteCardMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Card Details
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleUpdateTitle}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleUpdateDescription}
                  placeholder="Add a description..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <div className="space-y-3">
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1.5 rounded-full font-medium"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleAddTag} className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newTag.trim()}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 text-gray-700 dark:text-slate-300" />
                    </button>
                  </form>
                </div>
              </div>

              {/* High Priority Toggle */}
              <div className="py-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={highPriority}
                    onChange={(e) => {
                      const newValue = e.target.checked
                      setHighPriority(newValue)
                      updateCardMutation.mutate({ high_priority: newValue })
                    }}
                    className="w-5 h-5 text-blue-600 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2 transition-all"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    High Priority
                  </span>
                </label>
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Subtasks
                </label>
                <div className="space-y-2.5">
                  {card.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900 group transition-colors"
                    >
                      <button
                        onClick={() =>
                          toggleSubtaskMutation.mutate({
                            subtaskId: subtask.id,
                            completed: !subtask.completed,
                          })
                        }
                        className={`flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                          subtask.completed
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {subtask.completed && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          subtask.completed
                            ? 'line-through text-gray-400 dark:text-slate-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {subtask.text}
                      </span>
                      <button
                        onClick={() =>
                          deleteSubtaskMutation.mutate(subtask.id)
                        }
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}

                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskText}
                      onChange={(e) => setNewSubtaskText(e.target.value)}
                      placeholder="Add a subtask..."
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      disabled={
                        !newSubtaskText.trim() ||
                        createSubtaskMutation.isPending
                      }
                      className="px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 text-gray-700 dark:text-slate-300" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Linked Goal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  Linked Goal
                </label>
                <select
                  value={card.goal?.id || ''}
                  onChange={(e) => linkGoalMutation.mutate(e.target.value || null)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="">None</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.icon} {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Move Card */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Column
                  </label>
                  <select
                    value={card.column_id}
                    onChange={(e) =>
                      handleMoveCard(e.target.value, card.status)
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    {columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={card.status}
                    onChange={(e) =>
                      handleMoveCard(
                        card.column_id,
                        e.target.value as 'todo' | 'in_progress' | 'done'
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 mt-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Card
                </button>
                <div className="flex-1" />
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-colors font-medium shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
