import { supabase } from '@/lib/supabase'
import type { ScheduleTemplate, ScheduleEvent } from '@/lib/types/database'

interface TemplateEvent {
  title: string
  start_time: string
  end_time: string
  description?: string | null
  is_ai_generated?: boolean
}

export const scheduleTemplatesService = {
  // Get all templates for a user
  async getTemplates(userId: string): Promise<ScheduleTemplate[]> {
    const { data, error } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create a template from current schedule
  async createTemplate(
    userId: string,
    name: string,
    events: ScheduleEvent[],
    description?: string
  ): Promise<ScheduleTemplate> {
    // Extract only the necessary fields from events
    const templateData: TemplateEvent[] = events.map(event => ({
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      description: event.description,
      is_ai_generated: event.is_ai_generated,
    }))

    const { data, error} = await (supabase.from('schedule_templates') as any)
      .insert({
        user_id: userId,
        name,
        description: description || null,
        template_data: templateData,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a template
  async updateTemplate(
    templateId: string,
    updates: {
      name?: string
      description?: string | null
    }
  ): Promise<void> {
    const { error } = await (supabase.from('schedule_templates') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)

    if (error) throw error
  },

  // Delete a template
  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error
  },

  // Get template events (for applying to a date)
  getTemplateEvents(template: ScheduleTemplate): TemplateEvent[] {
    return template.template_data as unknown as TemplateEvent[]
  },
}
