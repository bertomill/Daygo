import { NextResponse } from 'next/server'

interface PixabayHit {
  id: number
  webformatURL: string
  tags: string
  user: string
}

interface PixabayResponse {
  total: number
  totalHits: number
  hits: PixabayHit[]
}

export interface HealthyFoodImage {
  id: number
  url: string
  alt: string
  photographer: string
}

export async function GET() {
  try {
    const apiKey = process.env.PIXABAY_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Pixabay API key not configured. Add PIXABAY_API_KEY to your .env.local' },
        { status: 500 }
      )
    }

    // Simple healthy ingredient queries - Pixabay has great isolated shots
    const allQueries = [
      'apple fruit isolated',
      'banana isolated white',
      'broccoli isolated',
      'avocado isolated',
      'orange fruit isolated',
      'strawberry isolated',
      'carrot isolated',
      'tomato isolated',
      'blueberry isolated',
      'spinach leaves',
      'salmon fillet',
      'almonds nuts',
      'lemon isolated',
      'kiwi fruit isolated',
    ]

    // Shuffle and pick 5 different ingredients
    const shuffled = allQueries.sort(() => Math.random() - 0.5)
    const queries = shuffled.slice(0, 5)

    // Fetch one image from each query
    const imagePromises = queries.map(async (query) => {
      const response = await fetch(
        `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5&safesearch=true`
      )

      if (!response.ok) {
        return null
      }

      const data: PixabayResponse = await response.json()
      if (data.hits.length === 0) return null

      // Pick a random image from results
      const randomIndex = Math.floor(Math.random() * Math.min(data.hits.length, 5))
      return data.hits[randomIndex]
    })

    const results = await Promise.all(imagePromises)
    const selected = results.filter((hit): hit is PixabayHit => hit !== null)

    const images: HealthyFoodImage[] = selected.map((hit) => ({
      id: hit.id,
      url: hit.webformatURL,
      alt: hit.tags,
      photographer: hit.user,
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching healthy food images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch healthy food images' },
      { status: 500 }
    )
  }
}
