import { supabase } from '../supabase'
import type { FoodImage, FoodCategory } from '../types/database'

export const foodImagesService = {
  async getFoodImages(userId: string): Promise<FoodImage[]> {
    const { data, error } = await supabase
      .from('food_images')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as FoodImage[]) ?? []
  },

  async getFoodImagesByCategory(userId: string, category: FoodCategory): Promise<FoodImage[]> {
    const { data, error } = await supabase
      .from('food_images')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data as FoodImage[]) ?? []
  },

  async createFoodImage(
    userId: string,
    category: FoodCategory,
    imageFile: File,
    name?: string
  ): Promise<FoodImage> {
    const imageUrl = await this.uploadImage(userId, imageFile)

    const { data, error } = await supabase
      .from('food_images')
      .insert({
        user_id: userId,
        category,
        image_url: imageUrl,
        name: name || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return data as FoodImage
  },

  async updateFoodImage(
    id: string,
    userId: string,
    updates: { name?: string | null; category?: FoodCategory; weight?: number }
  ): Promise<FoodImage> {
    console.log('Updating food image:', { id, userId, updates })
    const { data, error } = await (supabase
      .from('food_images') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      throw error
    }
    console.log('Update success:', data)
    return data as FoodImage
  },

  async deleteFoodImage(id: string, userId: string): Promise<void> {
    // Get image URL to delete from storage
    const { data: current } = await supabase
      .from('food_images')
      .select('image_url')
      .eq('id', id)
      .single()

    const typedCurrent = current as { image_url: string } | null
    if (typedCurrent?.image_url) {
      await this.deleteImageFromStorage(userId, typedCurrent.image_url)
    }

    const { error } = await (supabase
      .from('food_images') as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async uploadImage(userId: string, file: File): Promise<string> {
    // Handle clipboard images which may not have proper extensions
    let fileExt = file.name.split('.').pop()
    if (!fileExt || fileExt === file.name) {
      // Derive extension from mime type
      const mimeToExt: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
      }
      fileExt = mimeToExt[file.type] || 'png'
    }

    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath)

    return publicUrl
  },

  async deleteImageFromStorage(userId: string, imageUrl: string): Promise<void> {
    const fileName = imageUrl.split('/').pop()
    if (fileName) {
      await supabase.storage
        .from('food-images')
        .remove([`${userId}/${fileName}`])
    }
  }
}
