import { supabase } from '../supabase'
import type { Inspiration } from '../types/database'

export const inspirationsService = {
  async getInspirations(userId: string): Promise<Inspiration[]> {
    const { data, error } = await supabase
      .from('inspirations')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as Inspiration[]) ?? []
  },

  async createInspiration(
    userId: string,
    name: string,
    reason: string,
    imageFile?: File
  ): Promise<Inspiration> {
    let imageUrl: string | null = null

    if (imageFile) {
      imageUrl = await this.uploadImage(userId, imageFile)
    }

    const { data, error } = await supabase
      .from('inspirations')
      .insert({
        user_id: userId,
        name,
        reason,
        image_url: imageUrl,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as Inspiration
  },

  async updateInspiration(
    id: string,
    userId: string,
    name: string,
    reason: string,
    imageFile?: File | null,
    removeImage?: boolean
  ): Promise<Inspiration> {
    let imageUrl: string | undefined

    if (removeImage) {
      // Get current image to delete
      const { data: current } = await supabase
        .from('inspirations')
        .select('image_url')
        .eq('id', id)
        .single()

      const typedCurrent = current as { image_url: string | null } | null
      if (typedCurrent?.image_url) {
        await this.deleteImageFromStorage(userId, typedCurrent.image_url)
      }
      imageUrl = undefined
    } else if (imageFile) {
      // Delete old image if exists
      const { data: current } = await supabase
        .from('inspirations')
        .select('image_url')
        .eq('id', id)
        .single()

      const typedCurrent = current as { image_url: string | null } | null
      if (typedCurrent?.image_url) {
        await this.deleteImageFromStorage(userId, typedCurrent.image_url)
      }

      imageUrl = await this.uploadImage(userId, imageFile)
    }

    const updateData: any = { name, reason }
    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl || null
    }

    const { data, error } = await (supabase
      .from('inspirations') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Inspiration
  },

  async deleteInspiration(id: string, userId: string): Promise<void> {
    // Get image URL to delete from storage
    const { data: current } = await supabase
      .from('inspirations')
      .select('image_url')
      .eq('id', id)
      .single()

    const typedCurrent = current as { image_url: string | null } | null
    if (typedCurrent?.image_url) {
      await this.deleteImageFromStorage(userId, typedCurrent.image_url)
    }

    const { error } = await (supabase
      .from('inspirations') as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadImage(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('inspirations')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('inspirations')
      .getPublicUrl(filePath)

    return publicUrl
  },

  async deleteImageFromStorage(userId: string, imageUrl: string): Promise<void> {
    const fileName = imageUrl.split('/').pop()
    if (fileName) {
      await supabase.storage
        .from('inspirations')
        .remove([`${userId}/${fileName}`])
    }
  }
}
