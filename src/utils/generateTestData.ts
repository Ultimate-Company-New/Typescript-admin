import { USER_ROLES } from '../constants/appConstants'
import type { UserRequestModel } from '../models/api-models'

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
