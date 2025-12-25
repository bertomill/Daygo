import { supabase } from '../supabase'
import type { ScheduleEvent } from '../types/database'

export const scheduleService = {
  async getEvents(userId: string, date: string): Promise<ScheduleEvent[]> {
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_time', { ascending: true })

    if (error) throw error
    return (data as ScheduleEvent[]) ?? []
  },

  async createEvent(
    userId: string,
    title: string,
    date: string,
    startTime: string,
    endTime: string,
    description?: string
  ): Promise<ScheduleEvent> {
    const { data, error } = await supabase
      .from('schedule_events')
      .insert({
        user_id: userId,
        title,
        date,
        start_time: startTime,
        end_time: endTime,
        description: description || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as ScheduleEvent
  },

  async updateEvent(
    eventId: string,
    updates: {
      title?: string
      description?: string | null
      start_time?: string
      end_time?: string
    }
  ): Promise<ScheduleEvent> {
    const { data, error } = await (supabase
      .from('schedule_events') as any)
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error
    return data as ScheduleEvent
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_events')
      .delete()
      .eq('id', eventId)

    if (error) throw error
  },
}
