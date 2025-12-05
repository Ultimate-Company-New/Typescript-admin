import type { UserGroupRequestModel } from '../api/userGroupApi'
import { USER_ROLES } from '../constants/appConstants'
import type { LeadRequestModel, PromoRequestModel, UserRequestModel } from '../models/api-models'

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
