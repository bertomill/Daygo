import { supabase } from '../supabase'

export interface PepTalk {
  id: string
  user_id: string
  text: string
  date: string
  audio_url: string | null
  created_at: string
}

export const pepTalksService = {
  async getPepTalkForDate(userId: string, date: string): Promise<PepTalk | null> {
    const { data, error } = await supabase
      .from('pep_talks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    return data as PepTalk
  },

  async savePepTalk(userId: string, text: string, date: string): Promise<PepTalk> {
    // Upsert - insert or update if exists for that date
    const { data, error } = await supabase
      .from('pep_talks')
      .upsert(
        {
          user_id: userId,
          text,
          date,
        } as any,
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) throw error
    return data as PepTalk
  },

  async deletePepTalk(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('pep_talks')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)

    if (error) throw error
  },

  async updateAudioUrl(userId: string, date: string, audioUrl: string): Promise<PepTalk> {
    const { data, error } = await (supabase
      .from('pep_talks') as any)
      .update({ audio_url: audioUrl })
      .eq('user_id', userId)
      .eq('date', date)
      .select()
      .single()

    if (error) throw error
    return data as PepTalk
  },

  async generateAudio(userId: string, text: string, date: string): Promise<string> {
    const response = await fetch('/api/pep-talk/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId, date }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate audio')
    }

    const { audioUrl } = await response.json()

    // Update the pep talk with the audio URL
    await this.updateAudioUrl(userId, date, audioUrl)

    return audioUrl
  },
}
