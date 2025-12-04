/**
 * Todo Models
 * Type definitions for Todo operations
 */

export interface TodoRequestModel {
  todoId?: number
  task: string
  isDone: boolean
}

export interface TodoResponseModel {
  todoId: number
  task: string
  isDone: boolean
  userId: number
  createdAt: string
  updatedAt: string
}
