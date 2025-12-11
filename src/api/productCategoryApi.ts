import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Product'

export interface ProductCategoryWithPath {
  categoryId: number
  name: string
  fullPath: string
  parentId: number | null
  isEnd: boolean  // true = leaf (selectable), false = has children (drillable)
}

/**
 * Product Category API Service
 * Handles all product category-related API calls
 */
export const productCategoryApi = {
  /**
   * Get categories by parent ID for hierarchical navigation
   * If parentId is null/undefined: Returns all root categories
   * If parentId is provided: Returns ALL child categories of that parent (both leaf and non-leaf)
   *
   * The isEnd flag in each category indicates:
   * - isEnd=true: Leaf category (selectable)
   * - isEnd=false: Intermediate category with children (drillable)
   *
   * @param parentId - Optional parent category ID (null for root categories)
   * @returns Promise<ProductCategoryWithPath[]>
   */
  getCategoriesByParentId: async (parentId?: number | null): Promise<ProductCategoryWithPath[]> => {
    const params = parentId !== undefined && parentId !== null ? { parentId } : {}
    const response = await axiosInstance.get<ProductCategoryWithPath[]>(
      `${API_BASE_URL}/findCategoriesWithoutChildren`,
      { params }
    )
    return response.data
  },

  /**
   * Get all leaf categories with their full paths by recursively fetching the category tree
   * This is useful for displaying category dropdowns or finding a category by ID
   *
   * @returns Promise<ProductCategoryWithPath[]> - All leaf categories with full paths
   */
  getLeafCategoriesWithPaths: async (): Promise<ProductCategoryWithPath[]> => {
    const leafCategories: ProductCategoryWithPath[] = []

    // Recursive function to fetch all categories
    const fetchCategories = async (parentId: number | null): Promise<void> => {
      const categories = await productCategoryApi.getCategoriesByParentId(parentId)

      for (const category of categories) {
        if (category.isEnd) {
          // This is a leaf category - add to results
          leafCategories.push(category)
        } else {
          // This has children - recurse
          await fetchCategories(category.categoryId)
        }
      }
    }

    // Start from root categories
    await fetchCategories(null)

    return leafCategories
  },

  /**
   * Get category paths for multiple category IDs in a single API call
   * Returns a map of category ID to full path string (e.g., "Electronics > Computers > Laptops")
   * Much more efficient than fetching paths individually for bulk operations
   *
   * @param categoryIds - Array of category IDs to get paths for
   * @returns Promise<Record<number, string>> - Map of category ID to full path
   */
  getCategoryPathsByIds: async (categoryIds: number[]): Promise<Record<number, string>> => {
    if (categoryIds.length === 0) {
      return {}
    }
    const response = await axiosInstance.post<Record<number, string>>(
      `${API_BASE_URL}/getCategoryPathsByIds`,
      categoryIds
    )
    return response.data
  },

  /**
   * Find a category by ID with its full path
   * Searches through all categories to find the matching one
   *
   * @param categoryId - The category ID to find
   * @returns Promise<ProductCategoryWithPath | null> - The category with full path, or null if not found
   */
  getCategoryById: async (categoryId: number): Promise<ProductCategoryWithPath | null> => {
    // Search function that recursively looks for the category
    const searchCategory = async (parentId: number | null): Promise<ProductCategoryWithPath | null> => {
      const categories = await productCategoryApi.getCategoriesByParentId(parentId)

      for (const category of categories) {
        if (category.categoryId === categoryId) {
          return category
        }

        if (!category.isEnd) {
          // Has children - search deeper
          const found = await searchCategory(category.categoryId)
          if (found) {
            return found
          }
        }
      }

      return null
    }

    return searchCategory(null)
  },
}

export default productCategoryApi

