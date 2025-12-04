import React, { useState, useEffect, useCallback } from 'react'

import { toast } from 'react-toastify'

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material'
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  IconButton,
  Checkbox,
  Divider,
  Chip,
  InputAdornment,
  Paper,
} from '@mui/material'

import todoApi from '../../api/todoApi'
import { type TodoResponseModel, type TodoRequestModel } from '../../models/api-models'

import styles from './TodoList.module.scss'

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<TodoResponseModel[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await todoApi.getTodoItems()
      setTodos(data)
    } catch {
      toast.error('Failed to fetch todos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTodos()
  }, [fetchTodos])

  const handleAddTodo = async (): Promise<void> => {
    if (!newTask.trim()) {
      toast.warning('Please enter a task')
      return
    }

    try {
      const todoRequest: TodoRequestModel = {
        task: newTask,
        isDone: false,
      }
      await todoApi.addTodo(todoRequest)
      setNewTask('')
      toast.success('Task added successfully')
      void fetchTodos()
    } catch {
      toast.error('Failed to add task')
    }
  }

  const handleToggleDone = async (todoId: number): Promise<void> => {
    try {
      await todoApi.toggleTodoDone(todoId)
      void fetchTodos()
    } catch {
      toast.error('Failed to toggle task status')
    }
  }

  const handleDeleteTodo = async (todoId: number): Promise<void> => {
    try {
      await todoApi.deleteTodo(todoId)
      toast.success('Task deleted successfully')
      void fetchTodos()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      void handleAddTodo()
    }
  }

  const pendingTodos = todos.filter(todo => !todo.isDone)
  const completedTodos = todos.filter(todo => todo.isDone)

  return (
    <Box className={styles['todo-page']}>
      <Box className={styles['todo-page__header']}>
        <Typography variant="h4" className={styles['todo-page__title']}>
          My Tasks
        </Typography>
        <Box className={styles['todo-page__stats']}>
          <Chip
            label={`${pendingTodos.length} Pending`}
            color="warning"
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip
            label={`${completedTodos.length} Completed`}
            color="success"
            size="small"
          />
        </Box>
      </Box>

      {/* Add Task Section */}
      <Card className={styles['todo-page__add-card']}>
        <Box className={styles['todo-page__add-container']}>
          <TextField
            fullWidth
            placeholder="What needs to be done?"
            value={newTask}
            onChange={e => {
              setNewTask(e.target.value)
            }}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AddIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddTodo}
            disabled={!newTask.trim()}
            startIcon={<AddIcon />}
            sx={{ minWidth: '140px',
              height: '56px' }}
          >
            Add Task
          </Button>
        </Box>
      </Card>

      {/* Pending Tasks */}
      {pendingTodos.length > 0 && (
        <Card className={styles['todo-page__section-card']}>
          <Box className={styles['todo-page__section-header']}>
            <Typography variant="h6" className={styles['todo-page__section-title']}>
              Pending Tasks
            </Typography>
            <Chip label={pendingTodos.length} color="warning" size="small" />
          </Box>
          <Divider />
          <List className={styles['todo-page__list']}>
            {pendingTodos.map((todo, index) => (
              <React.Fragment key={todo.todoId}>
                <ListItem className={styles['todo-page__list-item']}>
                  <Checkbox
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<CheckCircleIcon />}
                    checked={todo.isDone}
                    onChange={() => handleToggleDone(todo.todoId)}
                    color="success"
                  />
                  <Typography
                    variant="body1"
                    className={styles['todo-page__task-text']}
                    sx={{
                      flex: 1,
                      ml: 2,
                      textDecoration: todo.isDone ? 'line-through' : 'none',
                      color: todo.isDone ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {todo.task}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTodo(todo.todoId)}
                    color="error"
                    className={styles['todo-page__delete-btn']}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < pendingTodos.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTodos.length > 0 && (
        <Card className={styles['todo-page__section-card']}>
          <Box className={styles['todo-page__section-header']}>
            <Typography variant="h6" className={styles['todo-page__section-title']}>
              Completed Tasks
            </Typography>
            <Chip label={completedTodos.length} color="success" size="small" />
          </Box>
          <Divider />
          <List className={styles['todo-page__list']}>
            {completedTodos.map((todo, index) => (
              <React.Fragment key={todo.todoId}>
                <ListItem className={`${styles['todo-page__list-item']} ${styles['todo-page__list-item--completed']}`}>
                  <Checkbox
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<CheckCircleIcon />}
                    checked={todo.isDone}
                    onChange={() => handleToggleDone(todo.todoId)}
                    color="success"
                  />
                  <Typography
                    variant="body1"
                    className={styles['todo-page__task-text']}
                    sx={{
                      flex: 1,
                      ml: 2,
                      textDecoration: 'line-through',
                      color: 'text.secondary',
                    }}
                  >
                    {todo.task}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTodo(todo.todoId)}
                    color="error"
                    className={styles['todo-page__delete-btn']}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < completedTodos.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* Empty State */}
      {todos.length === 0 && !loading && (
        <Paper className={styles['todo-page__empty']}>
          <CheckCircleIcon sx={{ fontSize: 80,
            color: 'text.disabled',
            mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tasks yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Add your first task to get started
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default TodoList
