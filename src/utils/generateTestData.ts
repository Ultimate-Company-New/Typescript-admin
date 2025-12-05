import type { UserGroupBulkCreateItem } from '../api/userGroupApi'
import { USER_ROLES } from '../constants/appConstants'
import type { UserRequestModel } from '../models/api-models'

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
 * Creates an array of UserGroupBulkCreateItem objects with varied test data
 *
 * @param numberOfRecords - Number of test user group records to generate
 * @param allUserIds - Array of available user IDs to assign to groups
 * @param minUsersPerGroup - Minimum users per group (default: 20)
 * @param maxUsersPerGroup - Maximum users per group (default: 30)
 * @returns Array of UserGroupBulkCreateItem objects for import API
 */
export const generateUserGroupImportTest = (
  numberOfRecords: number,
  allUserIds: number[],
  minUsersPerGroup = 20,
  maxUsersPerGroup = 30,
): UserGroupBulkCreateItem[] => {
  const userGroups: UserGroupBulkCreateItem[] = []
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
 * @returns Partial UserGroupBulkCreateItem for form population (without userIds)
 */
export const generateUserGroupFormTest = (
  preserveName?: string,
): Pick<UserGroupBulkCreateItem, 'groupName' | 'description' | 'notes'> => {
  const template = USER_GROUP_TEMPLATES[Math.floor(Math.random() * USER_GROUP_TEMPLATES.length)]

  return {
    groupName: preserveName ?? `Test Group - ${template.prefix} ${Date.now()}`,
    description: template.description,
    notes: template.notes,
  }
}
