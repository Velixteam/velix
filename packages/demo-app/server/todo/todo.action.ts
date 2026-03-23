import { serverAction, redirect } from 'velix';

// In-memory store for demo (resets on server restart)
let todos: { id: string; text: string; completed: boolean }[] = [
  { id: '1', text: 'Learn Velix Framework', completed: true },
  { id: '2', text: 'Build a Todo App', completed: false },
  { id: '3', text: 'Deploy to Vercel', completed: false },
];

export const getTodos = serverAction(async () => {
  return todos;
}, 'getTodos');

export const addTodo = serverAction(async (text: string) => {
  if (!text || text.trim() === '') throw new Error('Text is required');
  
  const newTodo = {
    id: Math.random().toString(36).substring(2, 10),
    text,
    completed: false
  };
  
  todos.push(newTodo);
  return newTodo;
}, 'addTodo');

export const toggleTodo = serverAction(async (id: string) => {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
  }
  return todo;
}, 'toggleTodo');

export const deleteTodo = serverAction(async (id: string) => {
  todos = todos.filter(t => t.id !== id);
  return { success: true };
}, 'deleteTodo');
