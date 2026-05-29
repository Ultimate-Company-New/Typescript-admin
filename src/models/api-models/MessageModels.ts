/**
 * Message Models
 * Type definitions for Message operations
 */

export interface MessageRequestModel {
  messageId?: number
  title: string
  descriptionHtml: string
  publishDate: string
  targetUserIds?: number[]
  targetGroupIds?: number[]
}

export interface MessageResponseModel {
  messageId: number
  title: string
  descriptionHtml: string
  publishDate: string
  sendAsEmail?: boolean
  isDeleted: boolean
  createdByUserId: number
  brevoEmailBatchId?: string
  createdAt: string
  updatedAt: string
  createdUser: string
  modifiedUser: string
  notes?: string
  auditUserId?: number

  // Related entities
  createdByUser?: {
    userId: number
    firstName: string
    lastName: string
    email: string
    loginName: string
  }
  auditUser?: {
    userId: number
    firstName: string
    lastName: string
    email: string
  }

  // Additional computed fields
  titlePreview?: string
  statusText?: string
  isPublished?: boolean
  canEdit?: boolean
  daysOld?: number

  // Message targeting information
  userGroupIds?: number[]
  userIds?: number[]
  totalRecipients?: number
  isRead?: boolean
}

export interface MessageReadStatus {
  messageId: number
  userId: number
  read: boolean
  readAt?: string
}
