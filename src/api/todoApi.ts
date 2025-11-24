import { type TodoRequestModel, type TodoResponseModel } from '../models/TodoModels'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Todo'

const todoApi = {
  /**
   * Get all todo items for the current user
   */
  getTodoItems: async (): Promise<TodoResponseModel[]> => {
    const response = await axiosInstance.get<TodoResponseModel[]>(`${API_BASE_URL}/getItems`)
    return response.data
  },

  /**
   * Add a new todo item
   */
  addTodo: async (todo: TodoRequestModel): Promise<void> => {
    await axiosInstance.put(`${API_BASE_URL}/addItem`, todo)
  },

  /**
   * Update an existing todo item
   */
  updateTodo: async (todo: TodoRequestModel): Promise<void> => {
    await axiosInstance.post(`${API_BASE_URL}/updateItem`, todo)
  },

  /**
   * Delete a todo item
   */
  deleteTodo: async (todoId: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/deleteItem/${todoId}`)
  },

  /**
   * Toggle the done status of a todo item
   */
  toggleTodoDone: async (todoId: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/toggleDone/${todoId}`)
  },
}

export default todoApi
