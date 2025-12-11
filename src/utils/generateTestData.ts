import { pickupLocationApi } from '../api/pickupLocationApi'
import { productCategoryApi, type ProductCategoryWithPath } from '../api/productCategoryApi'
import type { UserGroupRequestModel } from '../api/userGroupApi'
import {
  COUNTRIES,
  PRODUCT_COLOR_OPTIONS,
  PRODUCT_CONDITION_OPTIONS,
  USER_ROLES,
} from '../constants/appConstants'
import type { LeadRequestModel, ProductRequestModel, PromoRequestModel, UserRequestModel } from '../models/api-models'

// ============================================================================
// User Test Data Generation
// ============================================================================

/**
 * Generate test user data
 * Creates an array of test user objects with realistic test data
 *
 * @param numberOfRecords - Number of test user records to generate
 * @returns Array of UserRequestModel objects (includes imageUrl for import flows)
 */
export const generateUserTest = (numberOfRecords: number): Array<UserRequestModel & { imageUrl?: string }> => {
  const users: Array<UserRequestModel & { imageUrl?: string }> = []

  for (let i = 1; i <= numberOfRecords; i++) {
    const timestamp = Date.now() + i
    const randomAddressType = Math.random() < 0.5 ? 'HOME' : 'WORK'
    // Generate random profile picture URL using Picsum Photos (200x200 size)
    const randomImageId = 1 + Math.floor(Math.random() * 100) // Random ID between 1-100
    const imageUrl = `https://picsum.photos/200/200?random=${randomImageId + i}`

    const user: UserRequestModel & { imageUrl?: string } = {
      loginName: `nahushrai+ui_testuser${timestamp}@gmail.com`,
      firstName: 'UI Test',
      lastName: `User ${i}`,
      phone: '9876543210',
      role: USER_ROLES.SUPER_ADMIN,
      dob: '1990-01-15',
      imageUrl,
      address: {
        streetAddress: '123 Test Street',
        streetAddress2: 'Suite 100',
        streetAddress3: 'Building A, Floor 5',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        zipCode: '400001',
        country: 'India',
        addressType: randomAddressType,
        nameOnAddress: 'Test User',
        emailOnAddress: `test${timestamp}@example.com`,
        phoneOnAddress: '9123456789',
      },
      notes: 'This is a test user created for automated testing purposes.',
    }

    users.push(user)
  }

  return users
}

// ============================================================================
// User Group Test Data Generation
// ============================================================================

/**
 * User group template for test data generation (internal use)
 */
interface UserGroupTemplate {
  prefix: string
  description: string
  notes: string
}

/**
 * Pre-defined user group templates for variety in test data
 */
const USER_GROUP_TEMPLATES: UserGroupTemplate[] = [
  {
    prefix: 'Developers',
    description: 'Development team with full access to code repositories and deployment tools',
    notes: 'Handles core development and feature implementation',
  },
  {
    prefix: 'QA Team',
    description: 'Quality Assurance team responsible for testing and bug reporting',
    notes: 'Ensures quality through comprehensive testing',
  },
  {
    prefix: 'DevOps',
    description: 'Infrastructure and deployment management team',
    notes: 'Manages CI/CD pipelines and cloud infrastructure',
  },
  {
    prefix: 'Frontend Team',
    description: 'UI/UX development and design team',
    notes: 'Builds user interfaces and experiences',
  },
  {
    prefix: 'Backend Team',
    description: 'Server-side development and API team',
    notes: 'Develops APIs and server logic',
  },
  {
    prefix: 'Mobile Team',
    description: 'iOS and Android application development',
    notes: 'Creates native mobile applications',
  },
  {
    prefix: 'Data Science',
    description: 'Analytics and machine learning team',
    notes: 'Builds ML models and analyzes data',
  },
  {
    prefix: 'Security Team',
    description: 'Cybersecurity and compliance team',
    notes: 'Ensures system security and compliance',
  },
  {
    prefix: 'Support Team',
    description: 'Customer support and issue resolution',
    notes: 'Provides customer assistance and resolves issues',
  },
  {
    prefix: 'Product Team',
    description: 'Product management and strategy',
    notes: 'Defines product roadmap and features',
  },
]

/**
 * Get a random subset of user IDs from the available pool
 * @param allUserIds - Array of all available user IDs
 * @param min - Minimum number of user IDs to select (default: 3)
 * @param max - Maximum number of user IDs to select (default: 8)
 * @returns Array of randomly selected user IDs
 */
export const getRandomUserIdsArray = (allUserIds: number[], min = 3, max = 8): number[] => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const actualCount = Math.min(count, allUserIds.length)
  const shuffled = [...allUserIds].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, actualCount)
}

/**
 * Generate test data for user group bulk import
 * Creates an array of UserGroupRequestModel objects with varied test data
 *
 * @param numberOfRecords - Number of test user group records to generate
 * @param allUserIds - Array of available user IDs to assign to groups
 * @param minUsersPerGroup - Minimum users per group (default: 20)
 * @param maxUsersPerGroup - Maximum users per group (default: 30)
 * @returns Array of UserGroupRequestModel objects for import API
 */
export const generateUserGroupImportTest = (
  numberOfRecords: number,
  allUserIds: number[],
  minUsersPerGroup = 20,
  maxUsersPerGroup = 30,
): UserGroupRequestModel[] => {
  const userGroups: UserGroupRequestModel[] = []
  const baseTimestamp = Date.now()

  for (let i = 0; i < numberOfRecords; i++) {
    const template = USER_GROUP_TEMPLATES[i % USER_GROUP_TEMPLATES.length]
    const groupUserIds = getRandomUserIdsArray(allUserIds, minUsersPerGroup, maxUsersPerGroup)

    userGroups.push({
      groupName: `Test Group - ${template.prefix} ${baseTimestamp + i}`,
      description: template.description,
      notes: template.notes,
      userIds: groupUserIds,
    })
  }

  return userGroups
}

/**
 * Generate test data for a single user group form
 * Returns a random group template with a unique name
 *
 * @param preserveName - Optional existing name to preserve (for edit mode)
 * @returns Partial UserGroupRequestModel for form population (without userIds)
 */
export const generateUserGroupFormTest = (
  preserveName?: string,
): Pick<UserGroupRequestModel, 'groupName' | 'description' | 'notes'> => {
  const template = USER_GROUP_TEMPLATES[Math.floor(Math.random() * USER_GROUP_TEMPLATES.length)]

  return {
    groupName: preserveName ?? `Test Group - ${template.prefix} ${Date.now()}`,
    description: template.description,
    notes: template.notes,
  }
}

// ============================================================================
// Lead Test Data Generation
// ============================================================================

/**
 * Lead status options matching database constraints
 */
const LEAD_STATUSES = [
  'Not Contacted',
  'Attempted To Contact',
  'Contacted',
  'Contact In Future',
  'Re Qualified',
  'Not Qualified',
  'Lost Lead',
  'Junk Lead',
]

/**
 * Generate a random fax number (10 digits, same format as phone)
 * @returns 10-digit fax number string starting with 9 or 8
 */
const generateFaxNumber = (): string => {
  const prefix = Math.random() > 0.5 ? '98' : '88'
  const remaining = Math.floor(10000000 + Math.random() * 90000000)
  return `${prefix}${remaining}`
}

/**
 * Generate a random phone number (10 digits)
 * @returns 10-digit phone number string starting with 98
 */
const generatePhoneNumber = (): string => {
  return `98${Math.floor(10000000 + Math.random() * 90000000)}`
}

/**
 * Lead template for test data generation
 */
interface LeadTemplate {
  firstNamePrefix: string
  lastNamePrefix: string
  company: string
  title: string
  annualRevenue: string
  companySize: number
  notes: string
}

/**
 * Pre-defined lead templates for variety in test data
 */
const LEAD_TEMPLATES: LeadTemplate[] = [
  {
    firstNamePrefix: 'Tech',
    lastNamePrefix: 'Innovator',
    company: 'TechCorp Solutions',
    title: 'CTO',
    annualRevenue: '50000000',
    companySize: 250,
    notes: 'Interested in enterprise software solutions',
  },
  {
    firstNamePrefix: 'Sales',
    lastNamePrefix: 'Manager',
    company: 'Global Retail Inc',
    title: 'VP of Sales',
    annualRevenue: '100000000',
    companySize: 500,
    notes: 'Looking for CRM integration',
  },
  {
    firstNamePrefix: 'Marketing',
    lastNamePrefix: 'Director',
    company: 'Creative Agency Ltd',
    title: 'Marketing Director',
    annualRevenue: '10000000',
    companySize: 50,
    notes: 'Needs marketing automation tools',
  },
  {
    firstNamePrefix: 'Finance',
    lastNamePrefix: 'Analyst',
    company: 'Capital Finance Group',
    title: 'CFO',
    annualRevenue: '200000000',
    companySize: 1000,
    notes: 'Evaluating financial management software',
  },
  {
    firstNamePrefix: 'Operations',
    lastNamePrefix: 'Lead',
    company: 'Logistics Pro Services',
    title: 'Operations Manager',
    annualRevenue: '75000000',
    companySize: 300,
    notes: 'Interested in supply chain optimization',
  },
  {
    firstNamePrefix: 'HR',
    lastNamePrefix: 'Executive',
    company: 'People First Consulting',
    title: 'HR Director',
    annualRevenue: '25000000',
    companySize: 100,
    notes: 'Looking for HR management solutions',
  },
  {
    firstNamePrefix: 'Product',
    lastNamePrefix: 'Owner',
    company: 'Innovative Startups Inc',
    title: 'Product Manager',
    annualRevenue: '5000000',
    companySize: 25,
    notes: 'Early-stage startup seeking growth tools',
  },
  {
    firstNamePrefix: 'IT',
    lastNamePrefix: 'Specialist',
    company: 'Enterprise Systems Ltd',
    title: 'IT Manager',
    annualRevenue: '150000000',
    companySize: 750,
    notes: 'Needs infrastructure modernization',
  },
]

/**
 * Generate test data for a single lead form
 * Returns realistic lead data with unique email, phone, and fax
 *
 * @param preserveEmail - Optional existing email to preserve (for edit mode)
 * @returns LeadRequestModel for form population
 */
export const generateLeadFormTest = (preserveEmail?: string): LeadRequestModel => {
  const template = LEAD_TEMPLATES[Math.floor(Math.random() * LEAD_TEMPLATES.length)]
  const timestamp = Date.now()
  const randomStatus = LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)]

  return {
    firstName: `${template.firstNamePrefix} Test`,
    lastName: `${template.lastNamePrefix} ${timestamp % 10000}`,
    email: preserveEmail ?? `nahushrai+lead_test${timestamp}@gmail.com`,
    phone: generatePhoneNumber(),
    leadStatus: randomStatus,
    company: template.company,
    companySize: template.companySize,
    annualRevenue: template.annualRevenue,
    title: template.title,
    website: `https://www.${template.company.toLowerCase().replace(/\s+/g, '')}.com`,
    fax: generateFaxNumber(),
    address: {
      streetAddress: `${100 + Math.floor(Math.random() * 900)} Business Park Road`,
      streetAddress2: `Floor ${1 + Math.floor(Math.random() * 20)}`,
      streetAddress3: `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: `40${String(Math.floor(1000 + Math.random() * 9000)).substring(0, 4)}`,
      country: 'India',
      addressType: 'OFFICE',
    },
    notes: template.notes,
  }
}

/**
 * Generate test data for lead bulk import
 * Creates an array of lead objects with varied test data including phone and fax
 *
 * @param numberOfRecords - Number of test lead records to generate
 * @returns Array of LeadRequestModel objects for import
 */
export const generateLeadImportTest = (numberOfRecords: number): LeadRequestModel[] => {
  const leads: LeadRequestModel[] = []
  const baseTimestamp = Date.now()

  for (let i = 0; i < numberOfRecords; i++) {
    const template = LEAD_TEMPLATES[i % LEAD_TEMPLATES.length]
    const timestamp = baseTimestamp + i
    const randomStatus = LEAD_STATUSES[Math.floor(Math.random() * LEAD_STATUSES.length)]

    leads.push({
      firstName: `${template.firstNamePrefix} Test`,
      lastName: `${template.lastNamePrefix} ${i + 1}`,
      email: `nahushrai+lead_import${timestamp}@gmail.com`,
      phone: generatePhoneNumber(),
      leadStatus: randomStatus,
      company: template.company,
      companySize: template.companySize,
      annualRevenue: template.annualRevenue,
      title: template.title,
      website: `https://www.${template.company.toLowerCase().replace(/\s+/g, '')}.com`,
      fax: generateFaxNumber(),
      address: {
        streetAddress: `${100 + Math.floor(Math.random() * 900)} Business Park Road`,
        streetAddress2: `Floor ${1 + Math.floor(Math.random() * 20)}`,
        streetAddress3: `Building ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: `40${String(Math.floor(1000 + Math.random() * 9000)).substring(0, 4)}`,
        country: 'India',
        addressType: 'OFFICE',
      },
      notes: template.notes,
    })
  }

  return leads
}

// ============================================================================
// Promo Test Data Generation
// ============================================================================

/**
 * Promo template for test data generation
 */
interface PromoTemplate {
  codePrefix: string
  description: string
  discountValue: number
  isPercent: boolean
  notes: string
}

/**
 * Pre-defined promo templates for variety in test data
 */
const PROMO_TEMPLATES: PromoTemplate[] = [
  {
    codePrefix: 'SUMMER',
    description: 'Summer sale discount - valid for all products',
    discountValue: 20,
    isPercent: true,
    notes: 'Limited time summer promotion',
  },
  {
    codePrefix: 'FLAT',
    description: 'Flat discount on orders above ₹1000',
    discountValue: 100,
    isPercent: false,
    notes: 'Applicable on minimum order of ₹1000',
  },
  {
    codePrefix: 'WELCOME',
    description: 'Welcome discount for new customers',
    discountValue: 15,
    isPercent: true,
    notes: 'First order only',
  },
  {
    codePrefix: 'FESTIVE',
    description: 'Festive season special discount',
    discountValue: 25,
    isPercent: true,
    notes: 'Valid during festive season',
  },
  {
    codePrefix: 'LOYALTY',
    description: 'Loyalty reward for returning customers',
    discountValue: 200,
    isPercent: false,
    notes: 'For customers with 5+ orders',
  },
  {
    codePrefix: 'FLASH',
    description: 'Flash sale - limited time offer',
    discountValue: 30,
    isPercent: true,
    notes: 'Valid for 24 hours only',
  },
  {
    codePrefix: 'BULK',
    description: 'Bulk order discount',
    discountValue: 500,
    isPercent: false,
    notes: 'Minimum 10 items required',
  },
  {
    codePrefix: 'VIP',
    description: 'VIP customer exclusive discount',
    discountValue: 35,
    isPercent: true,
    notes: 'VIP members only',
  },
]

/**
 * Generate test data for a single promo form
 * Returns realistic promo data with unique code
 *
 * @param preservePromoCode - Optional existing promo code to preserve (for edit mode)
 * @returns PromoRequestModel for form population
 */
export const generatePromoFormTest = (preservePromoCode?: string): PromoRequestModel => {
  const template = PROMO_TEMPLATES[Math.floor(Math.random() * PROMO_TEMPLATES.length)]
  const timestamp = Date.now()

  // Generate start date (today + 5 days minimum for safety)
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0) // Reset to midnight to avoid timezone issues
  startDate.setDate(startDate.getDate() + 5) // Always 5 days from today

  // Generate expiry date (1 day to 1 year from start date)
  const expiryDaysToAdd = 1 + Math.floor(Math.random() * 365) // Random between 1 and 365 days
  const expiryDate = new Date(startDate)
  expiryDate.setDate(expiryDate.getDate() + expiryDaysToAdd)

  return {
    promoCode: preservePromoCode ?? `${template.codePrefix}_${timestamp % 100000}`,
    description: template.description,
    discountValue: template.discountValue,
    isPercent: template.isPercent,
    notes: template.notes,
    startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    expiryDate: expiryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
  }
}

/**
 * Generate test data for promo bulk import
 * Creates an array of promo objects with varied test data
 *
 * @param numberOfRecords - Number of test promo records to generate
 * @returns Array of PromoRequestModel objects for import
 */
export const generatePromoImportTest = (numberOfRecords: number): PromoRequestModel[] => {
  const promos: PromoRequestModel[] = []
  const baseTimestamp = Date.now()

  for (let i = 0; i < numberOfRecords; i++) {
    const template = PROMO_TEMPLATES[i % PROMO_TEMPLATES.length]
    const timestamp = baseTimestamp + i

    // Generate start date (today + 5 days minimum for safety, with some variation)
    const startDaysToAdd = 5 + Math.floor(Math.random() * 30) // Random between 5 and 34 days from today
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0) // Reset to midnight to avoid timezone issues
    startDate.setDate(startDate.getDate() + startDaysToAdd)

    // Generate expiry date (1 day to 1 year from start date)
    const expiryDaysToAdd = 1 + Math.floor(Math.random() * 365) // Random between 1 and 365 days
    const expiryDate = new Date(startDate)
    expiryDate.setDate(expiryDate.getDate() + expiryDaysToAdd)

    promos.push({
      promoCode: `${template.codePrefix}_${timestamp % 100000}`,
      description: template.description,
      discountValue: template.discountValue + Math.floor(Math.random() * 10),
      isPercent: template.isPercent,
      startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      expiryDate: expiryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      notes: template.notes,
    })
  }

  return promos
}

// ============================================================================
// Product Test Data Generation
// ============================================================================

/**
 * Product brands for random selection
 */
const PRODUCT_BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'Nike',
  'Adidas',
  'LG',
  'Dell',
  'HP',
  'Lenovo',
  'ASUS',
  'Bose',
  'JBL',
  'Canon',
  'Nikon',
  'Dyson',
  'Philips',
  'Panasonic',
  'Xiaomi',
  'OnePlus',
  'Puma',
  'Reebok',
  'Under Armour',
  'Logitech',
  'Microsoft',
  'Razer',
] as const

/**
 * Product adjectives for dynamic title generation
 */
const PRODUCT_ADJECTIVES = [
  'Premium',
  'Professional',
  'Advanced',
  'Ultimate',
  'Essential',
  'Classic',
  'Modern',
  'Compact',
  'Portable',
  'Wireless',
  'Smart',
  'Digital',
  'Ergonomic',
  'Lightweight',
  'Heavy Duty',
  'High Performance',
  'Energy Efficient',
  'Eco Friendly',
  'Waterproof',
  'Durable',
] as const

/**
 * Product suffixes for dynamic title generation
 */
const PRODUCT_SUFFIXES = [
  'Edition',
  'Series',
  'Collection',
  'Version',
  'Gen 2',
  'Gen 3',
  'Plus',
  'Pro',
  'Max',
  'Ultra',
  'Lite',
  'Mini',
  'XL',
  '2024',
  'Mark II',
  'Special Edition',
  'Limited Edition',
  'Anniversary Edition',
] as const

/**
 * Generate a random product title using the category name from database
 */
const generateProductTitle = (brand: string, categoryName: string): string => {
  const useAdjective = Math.random() > 0.3 // 70% chance to include adjective
  const useSuffix = Math.random() > 0.5 // 50% chance to include suffix

  const adjective = useAdjective
    ? PRODUCT_ADJECTIVES[Math.floor(Math.random() * PRODUCT_ADJECTIVES.length)]
    : ''
  const suffix = useSuffix ? PRODUCT_SUFFIXES[Math.floor(Math.random() * PRODUCT_SUFFIXES.length)] : ''

  // Build title parts
  const parts = [brand]
  if (adjective) parts.push(adjective)
  parts.push(categoryName)
  if (suffix) parts.push(suffix)

  return parts.join(' ')
}

/**
 * Model name prefixes for random model generation
 */
const MODEL_PREFIXES = ['Pro', 'Elite', 'Max', 'Plus', 'Ultra', 'Premium', 'Classic', 'Sport', 'Air', 'Lite'] as const

/**
 * Generate a random UPC code
 */
const generateRandomUPC = (): string => {
  let upc = ''
  for (let i = 0; i < 12; i++) {
    upc += Math.floor(Math.random() * 10).toString()
  }
  return upc
}

/**
 * Generate comprehensive HTML description for a product
 */
const generateProductDescription = (
  productType: string,
  brand: string,
  color: string,
  condition: string,
): string => {
  const features = [
    'Premium build quality with attention to detail',
    'Engineered for optimal performance and durability',
    'Sleek and modern design that complements any style',
    'Easy to use with intuitive controls',
    'Energy efficient and environmentally friendly',
    'Backed by manufacturer warranty for peace of mind',
  ]

  const highlights = [
    'Industry-leading technology',
    'Exceptional value for money',
    'Customer favorite choice',
    'Award-winning design',
    'Top-rated by experts',
  ]

  // Build condition notes dynamically using PRODUCT_CONDITION_OPTIONS values
  const conditionNotes: Record<string, string> = {
    [PRODUCT_CONDITION_OPTIONS[0].value]: 'Brand new, never used, with all original tags and packaging intact.',
    [PRODUCT_CONDITION_OPTIONS[1].value]: 'Brand new condition, tags removed but never used or worn.',
    [PRODUCT_CONDITION_OPTIONS[2].value]: 'New item with minor cosmetic imperfections that do not affect functionality.',
    [PRODUCT_CONDITION_OPTIONS[3].value]: 'Gently used in excellent condition with minimal signs of wear.',
    [PRODUCT_CONDITION_OPTIONS[4].value]: 'Previously owned with visible wear or minor functional issues noted.',
  }

  // Randomly select 3-4 features
  const shuffledFeatures = [...features].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2))

  // Randomly select 2-3 highlights
  const shuffledHighlights = [...highlights].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2))

  return `
    <div class="product-description">
      <h3>About This Product</h3>
      <p>Introducing the <strong>${brand} ${productType}</strong> in stunning <em>${color}</em>.
      This exceptional product combines cutting-edge technology with premium craftsmanship to deliver
      an unparalleled experience.</p>

      <h4>Key Features</h4>
      <ul>
        ${shuffledFeatures.map((f) => `<li>${f}</li>`).join('\n        ')}
      </ul>

      <h4>Why Choose This Product?</h4>
      <p>${shuffledHighlights.join(' • ')}</p>

      <h4>Product Condition</h4>
      <p><strong>${condition.replace(/_/g, ' ')}:</strong> ${conditionNotes[condition] || 'Standard condition.'}</p>

      <h4>What's Included</h4>
      <ul>
        <li>1x ${brand} ${productType}</li>
        <li>User manual and documentation</li>
        <li>Original packaging (where applicable)</li>
        <li>Manufacturer warranty card</li>
      </ul>

      <blockquote>
        <p><em>"Quality is not an act, it is a habit."</em> - We stand behind every product we sell.</p>
      </blockquote>
    </div>
  `.trim()
}

/**
 * Generate random product notes based on condition
 */
const generateProductNotes = (condition: string): string => {
  // Build notes dynamically using PRODUCT_CONDITION_OPTIONS values
  const notesByCondition: Record<string, string[]> = {
    [PRODUCT_CONDITION_OPTIONS[0].value]: [
      'Factory sealed, never opened',
      'All original accessories included',
      'Perfect gift condition',
      'Includes manufacturer warranty',
      'Brand new in original packaging',
    ],
    [PRODUCT_CONDITION_OPTIONS[1].value]: [
      'New condition, packaging opened for inspection',
      'Never used, display item',
      'All accessories present',
      'Excellent condition, no defects',
      'Store display item, like new',
    ],
    [PRODUCT_CONDITION_OPTIONS[2].value]: [
      'Minor cosmetic scratch on surface',
      'Small dent that does not affect function',
      'Packaging damaged but product intact',
      'Minor scuff marks from shipping',
      'Slight discoloration, fully functional',
    ],
    [PRODUCT_CONDITION_OPTIONS[3].value]: [
      'Gently used, excellent condition',
      'Well maintained, minimal wear',
      'Previously loved, works perfectly',
      'Light use, no visible damage',
      'Great condition for pre-owned',
    ],
    [PRODUCT_CONDITION_OPTIONS[4].value]: [
      'Visible wear on exterior',
      'Minor functional quirk noted in description',
      'Shows signs of regular use',
      'Working condition with cosmetic issues',
      'Priced to sell, as-is condition',
    ],
  }

  const defaultNotes = notesByCondition[PRODUCT_CONDITION_OPTIONS[3].value]
  const notes = notesByCondition[condition] || defaultNotes
  return notes[Math.floor(Math.random() * notes.length)]
}

/**
 * Generate realistic sample images for testing
 * Uses a mix of placeholder image services
 * @param hasDefect - Whether the item has a defect (determines if defectImage should be generated)
 */
const generateTestImages = (hasDefect: boolean, productIndex: number) => {
  // Use combination of timestamp, product index, and random number for truly unique seeds
  const uniqueBase = `${Date.now()}_${productIndex}_${Math.floor(Math.random() * 100000)}`
  // Each image needs a unique random seed for picsum.photos to return different images
  const getImageUrl = (imageType: string): string => `https://picsum.photos/seed/${uniqueBase}_${imageType}/400/400`

  return {
    mainImage: getImageUrl('main'),
    topImage: getImageUrl('top'),
    bottomImage: getImageUrl('bottom'),
    frontImage: getImageUrl('front'),
    backImage: getImageUrl('back'),
    rightImage: getImageUrl('right'),
    leftImage: getImageUrl('left'),
    detailsImage: getImageUrl('details'),
    defectImage: hasDefect ? getImageUrl('defect') : '',
    additionalImage1: getImageUrl('add1'),
    additionalImage2: getImageUrl('add2'),
    additionalImage3: getImageUrl('add3'),
  }
}

/**
 * Recursively fetches categories until reaching a leaf node
 * Starts from root (parentId=null) and drills down randomly until isEnd=true
 *
 * @param parentId - Parent category ID (null for root categories)
 * @returns Promise<ProductCategoryWithPath> - A randomly selected leaf category
 */
const findRandomLeafCategory = async (parentId: number | null = null): Promise<ProductCategoryWithPath | null> => {
  try {
    const categories = await productCategoryApi.getCategoriesByParentId(parentId)

    if (categories.length === 0) {
      return null
    }

    // Randomly select a category from the current level
    const randomIndex = Math.floor(Math.random() * categories.length)
    const selectedCategory = categories[randomIndex]

    // If it's a leaf node (isEnd=true), return it
    if (selectedCategory.isEnd) {
      return selectedCategory
    }

    // Otherwise, drill down into this category
    return findRandomLeafCategory(selectedCategory.categoryId)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return null
  }
}

/**
 * Extended ProductRequestModel with category display information and form-specific fields
 */
export interface ProductTestData extends Omit<ProductRequestModel, 'itemAvailableFrom' | 'itemAvailableFromTimezone'> {
  categoryFullPath?: string
  categoryParentId?: number | null
  // Form uses a structured object for datetime with timezone
  itemAvailableFrom: {
    dateTime: Date
    timezone: string
  }
}

/**
 * Generate test data for product form
 * Creates a single product with randomly generated test data for form filling
 * Uses constants from appConstants for colors, countries, and conditions
 * Fetches real pickup location IDs and categories from the database
 *
 * @returns Promise<ProductTestData> for form population (includes categoryFullPath for display)
 */
export const generateProductFormTest = async (productIndex: number = 0): Promise<ProductTestData> => {
  // Randomly select brand
  const brand = PRODUCT_BRANDS[Math.floor(Math.random() * PRODUCT_BRANDS.length)]
  const modelPrefix = MODEL_PREFIXES[Math.floor(Math.random() * MODEL_PREFIXES.length)]
  const modelNumber = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
  const model = `${modelPrefix} ${modelNumber}`

  // Random color from PRODUCT_COLOR_OPTIONS
  const randomColor = PRODUCT_COLOR_OPTIONS[Math.floor(Math.random() * PRODUCT_COLOR_OPTIONS.length)]
  const color = randomColor.hex
  const colorLabel = randomColor.name

  // Random condition from PRODUCT_CONDITION_OPTIONS
  const randomCondition = PRODUCT_CONDITION_OPTIONS[Math.floor(Math.random() * PRODUCT_CONDITION_OPTIONS.length)]
  const condition = randomCondition.value

  // Random country from COUNTRIES
  const countryOfManufacture = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]

  // Check if condition has defects for image generation
  const hasDefect = condition.includes('DEFECT')
  const images = generateTestImages(hasDefect, productIndex)

  // Generate random dimensions and weight
  const length = 10 + Math.floor(Math.random() * 40) // 10-50 cm
  const breadth = 10 + Math.floor(Math.random() * 40) // 10-50 cm
  const height = 5 + Math.floor(Math.random() * 30) // 5-35 cm
  const weightKgs = 0.5 + Math.random() * 4.5 // 0.5-5 kg

  // Fetch a random leaf category by drilling down from root
  let categoryId = 1 // Default fallback
  let categoryFullPath = '' // Store the full path for display
  let categoryParentId: number | null = null // Store parent ID for navigation
  try {
    const leafCategory = await findRandomLeafCategory(null)
    if (leafCategory) {
      categoryId = leafCategory.categoryId
      categoryFullPath = leafCategory.fullPath
      categoryParentId = leafCategory.parentId
    }
  } catch (error) {
    console.warn('Failed to fetch leaf category, using default:', error)
  }

  // Generate random modification flag (30% chance of being modified)
  const itemModified = Math.random() > 0.7

  // Generate random price (₹500 - ₹200,000)
  const price = Math.floor(Math.random() * 199500) + 500

  // Generate random discount (0-50% or ₹0-₹10,000)
  const isDiscountPercent = Math.random() > 0.5
  const discount = isDiscountPercent
    ? Math.floor(Math.random() * 51) // 0-50%
    : Math.floor(Math.random() * 10001) // ₹0-₹10,000

  // Random returns allowed (70% chance of being allowed)
  const returnsAllowed = Math.random() > 0.3

  // Fetch real pickup locations from database and randomly select 5
  const pickupLocationQuantities: Record<string, number> = {}
  try {
    const response = await pickupLocationApi.getPickupLocationsInBatches({
      start: 0,
      end: 50,
      pageSize: 50,
    })

    // Extract pickup location data from response
    const locations = (response.data || []) as Array<{ pickupLocationId: number }>

    if (locations.length > 0) {
      // Randomly select 5 locations (or fewer if less than 5 available)
      const numLocations = Math.min(5, locations.length)
      const shuffled = [...locations].sort(() => Math.random() - 0.5)
      const selectedLocations = shuffled.slice(0, numLocations)

      // Build pickupLocationQuantities with selected locations and random quantities
      selectedLocations.forEach((location) => {
        const quantity = 5 + Math.floor(Math.random() * 46) // Random quantity 5-50
        pickupLocationQuantities[location.pickupLocationId.toString()] = quantity
      })
    }
  } catch (error) {
    console.warn('Failed to fetch pickup locations for test data:', error)
    // If API fails, leave pickup locations empty
  }

  // Extract category name from full path (last segment after " > ")
  const categoryName = categoryFullPath ? categoryFullPath.split(' > ').pop() || 'Product' : 'Product'

  // Generate product title using brand and category name from database
  const title = generateProductTitle(brand, categoryName)

  // Generate comprehensive HTML description
  const descriptionHtml = generateProductDescription(categoryName, brand, colorLabel, condition)

  // Generate notes based on condition
  const notes = generateProductNotes(condition)

  // Generate a future availability date (1-30 days from now)
  const daysInFuture = 1 + Math.floor(Math.random() * 30)
  const hoursInDay = Math.floor(Math.random() * 24)
  const minutesInHour = Math.floor(Math.random() * 60)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysInFuture)
  futureDate.setHours(hoursInDay, minutesInHour, 0, 0)

  // Random timezone selection (prefer Indian timezone for test data)
  const timezones = ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']
  const randomTimezone = timezones[Math.floor(Math.random() * timezones.length)]

  return {
    title,
    descriptionHtml,
    brand,
    model,
    condition,
    color,
    colorLabel,
    upc: generateRandomUPC(),
    countryOfManufacture,
    itemModified,
    modificationHtml: itemModified
      ? `<div class="modifications">
          <h4>Custom Modifications</h4>
          <ul>
            <li>Enhanced cooling system for better thermal management</li>
            <li>Upgraded internal components for improved performance</li>
            <li>Custom firmware/software optimizations</li>
            <li>Additional accessories included</li>
          </ul>
          <p><em>Note: Modifications performed by certified technicians.</em></p>
        </div>`
      : undefined,
    price,
    discount,
    isDiscountPercent,
    returnsAllowed,
    length: Math.round(length * 100) / 100,
    breadth: Math.round(breadth * 100) / 100,
    height: Math.round(height * 100) / 100,
    weightKgs: Math.round(weightKgs * 100) / 100,
    categoryId,
    categoryFullPath, // Include full path for display in CategoryAutocomplete
    categoryParentId, // Include parent ID for navigation state
    mainImage: images.mainImage,
    topImage: images.topImage,
    bottomImage: images.bottomImage,
    frontImage: images.frontImage,
    backImage: images.backImage,
    rightImage: images.rightImage,
    leftImage: images.leftImage,
    detailsImage: images.detailsImage,
    defectImage: images.defectImage || undefined,
    additionalImage1: images.additionalImage1 || undefined,
    additionalImage2: images.additionalImage2 || undefined,
    additionalImage3: images.additionalImage3 || undefined,
    pickupLocationQuantities,
    notes,
    itemAvailableFrom: {
      dateTime: futureDate,
      timezone: randomTimezone,
    },
  }
}

// ============================================================================
// Package Test Data Generation
// ============================================================================

/**
 * Package types matching database constraint
 */
const PACKAGE_TYPES = ['STANDARD', 'FRAGILE', 'OVERSIZED', 'ENVELOPE', 'BOX', 'TUBE', 'CUSTOM'] as const

/**
 * Package name templates for variety in test data
 */
const PACKAGE_NAME_TEMPLATES = [
  { prefix: 'Small', suffix: 'Box' },
  { prefix: 'Medium', suffix: 'Box' },
  { prefix: 'Large', suffix: 'Box' },
  { prefix: 'Extra Large', suffix: 'Container' },
  { prefix: 'Compact', suffix: 'Mailer' },
  { prefix: 'Flat', suffix: 'Envelope' },
  { prefix: 'Padded', suffix: 'Envelope' },
  { prefix: 'Bubble', suffix: 'Mailer' },
  { prefix: 'Fragile Item', suffix: 'Box' },
  { prefix: 'Heavy Duty', suffix: 'Crate' },
  { prefix: 'Poster', suffix: 'Tube' },
  { prefix: 'Document', suffix: 'Sleeve' },
  { prefix: 'Gift', suffix: 'Box' },
  { prefix: 'Electronics', suffix: 'Case' },
  { prefix: 'Clothing', suffix: 'Bag' },
] as const

/**
 * Package notes templates
 */
const PACKAGE_NOTES = [
  'Standard shipping package for general merchandise',
  'Reinforced corners for extra protection',
  'Weather-resistant material',
  'Ideal for fragile items requiring extra care',
  'Eco-friendly recyclable packaging',
  'Self-sealing adhesive strip included',
  'Compatible with automated sorting systems',
  'Meets international shipping standards',
  'Stackable design for efficient storage',
  'Includes packing slip pouch',
]

/**
 * Package request model for API calls
 */
export interface PackageRequestModel {
  packageId?: number
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  notes?: string
}

/**
 * Generate test data for a single package form
 * Creates a package with randomly generated test data
 *
 * @param preserveName - Optional existing name to preserve (for edit mode)
 * @returns PackageRequestModel for form population
 */
export const generatePackageFormTest = (preserveName?: string): PackageRequestModel => {
  const template = PACKAGE_NAME_TEMPLATES[Math.floor(Math.random() * PACKAGE_NAME_TEMPLATES.length)]
  const timestamp = Date.now()

  // Random dimensions
  const length = 10 + Math.floor(Math.random() * 90) // 10-100 cm
  const breadth = 10 + Math.floor(Math.random() * 60) // 10-70 cm
  const height = 5 + Math.floor(Math.random() * 50) // 5-55 cm

  // Random weight and capacity
  const maxWeight = Math.round((1 + Math.random() * 29) * 100) / 100 // 1-30 kg, 2 decimal places
  const standardCapacity = 1 + Math.floor(Math.random() * 20) // 1-20 items

  // Random price (₹10 - ₹500)
  const pricePerUnit = Math.round((10 + Math.random() * 490) * 100) / 100

  // Random package type
  const packageType = PACKAGE_TYPES[Math.floor(Math.random() * PACKAGE_TYPES.length)]

  // Random notes
  const notes = PACKAGE_NOTES[Math.floor(Math.random() * PACKAGE_NOTES.length)]

  return {
    packageName: preserveName ?? `${template.prefix} ${template.suffix} - ${timestamp % 100000}`,
    length,
    breadth,
    height,
    maxWeight,
    standardCapacity,
    pricePerUnit,
    packageType,
    notes,
  }
}

/**
 * Generate test data for package bulk import
 * Creates an array of package objects with varied test data
 *
 * @param numberOfRecords - Number of test package records to generate
 * @returns Array of PackageRequestModel objects for import
 */
export const generatePackageImportTest = (numberOfRecords: number): PackageRequestModel[] => {
  const packages: PackageRequestModel[] = []
  const baseTimestamp = Date.now()

  for (let i = 0; i < numberOfRecords; i++) {
    const template = PACKAGE_NAME_TEMPLATES[i % PACKAGE_NAME_TEMPLATES.length]
    const timestamp = baseTimestamp + i

    // Vary dimensions based on template
    const sizeMultiplier = i % 3 === 0 ? 1 : i % 3 === 1 ? 1.5 : 2
    const length = Math.floor((15 + Math.floor(Math.random() * 40)) * sizeMultiplier)
    const breadth = Math.floor((10 + Math.floor(Math.random() * 30)) * sizeMultiplier)
    const height = Math.floor((8 + Math.floor(Math.random() * 25)) * sizeMultiplier)

    // Weight and capacity scale with size
    const maxWeight = Math.round((2 + Math.random() * 15) * sizeMultiplier * 100) / 100
    const standardCapacity = Math.floor((2 + Math.random() * 8) * sizeMultiplier)

    // Price scales with size
    const pricePerUnit = Math.round((20 + Math.random() * 100) * sizeMultiplier * 100) / 100

    // Cycle through package types
    const packageType = PACKAGE_TYPES[i % PACKAGE_TYPES.length]

    packages.push({
      packageName: `${template.prefix} ${template.suffix} - ${timestamp % 100000}`,
      length,
      breadth,
      height,
      maxWeight,
      standardCapacity,
      pricePerUnit,
      packageType,
      notes: PACKAGE_NOTES[i % PACKAGE_NOTES.length],
    })
  }

  return packages
}
