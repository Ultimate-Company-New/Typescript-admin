import { productApi } from '../api/productApi'
import { buildProductImages, type CarouselImage } from '../components/carousel'

const IMAGE_LABELS = [
  'Main',
  'Top',
  'Bottom',
  'Front',
  'Back',
  'Right',
  'Left',
  'Details',
  'Defect',
  'Additional 1',
  'Additional 2',
  'Additional 3',
] as const

/**
 * Builds carousel images from API/DB product fields, falling back to the
 * getProductImage endpoint when stored URLs are empty placeholders.
 */
export function resolveProductCarouselImages(
  product: Record<string, unknown>,
  productIdOverride?: number,
): CarouselImage[] {
  const fromFields = buildProductImages(product)
  if (fromFields.length > 0) {
    return fromFields
  }

  const productId =
    (typeof product.productId === 'number' ? product.productId : undefined) ??
    productIdOverride

  if (productId == null || productId <= 0) {
    return []
  }

  return IMAGE_LABELS.map(label => ({
    url: productApi.getProductImageUrl(productId, label),
    label,
  })).slice(0, 1)
}
