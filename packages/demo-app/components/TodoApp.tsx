/** @jsxImportSource react */
'use island';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { addTodo, toggleTodo, deleteTodo } from '../server/todo/todo.action';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function TodoApp({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [inputValue, setInputValue] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsPending(true);
    try {
      const result = await addTodo(inputValue) as any;
      if (result.success && result.data) {
        setTodos([...todos, result.data]);
        setInputValue('');
      }
    } catch (err) {
      console.error('Failed to add todo:', err);
    } finally {
      setIsPending(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    try {
      await toggleTodo(id) as any;
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const previousTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    try {
      const result = await deleteTodo(id) as any;
      if (!result.success) {
        setTodos(previousTodos);
      }
    } catch (err) {
      setTodos(previousTodos);
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card title="My Tasks" description="Manage your daily objectives with Velix Actions.">
        <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending} className="!h-10 px-4">
            {isPending ? '...' : 'Add'}
          </Button>
        </form>

        <ul className="space-y-3">
          {todos.map((todo) => (
            <li 
              key={todo.id} 
              className="flex items-center justify-between p-3 bg-[#1E293B]/50 rounded-xl border border-slate-800 group hover:border-[#22D3EE]/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo.id)}
                  className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-[#2563EB] focus:ring-[#22D3EE]/50"
                />
                <span className={`text-slate-200 ${todo.completed ? 'line-through opacity-50' : ''}`}>
                  {todo.text}
                </span>
              </div>
              <button 
                onClick={() => handleDelete(todo.id)}
                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            </li>
          ))}
          {todos.length === 0 && (
            <p className="text-center text-slate-500 py-4">No tasks yet. Add one above!</p>
          )}
        </ul>
      </Card>
    </div>
  );
}
