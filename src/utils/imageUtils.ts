/**
 * Image Utility Functions
 * Helper functions for image processing and conversion
 */

/**
 * Convert an image URL to base64 string
 * Fetches the image from the URL and converts it to base64 format
 *
 * @param url - The URL of the image to convert
 * @returns Promise that resolves to base64 string (without data URL prefix) or undefined if conversion fails
 *
 * @example
 * const base64 = await convertImageUrlToBase64('https://example.com/image.jpg')
 * if (base64) {
 *   console.log('Base64:', base64)
 * }
 */
export const convertImageUrlToBase64 = async (url: string): Promise<string | undefined> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    // Failed to convert image URL to base64
    return undefined
  }
}
