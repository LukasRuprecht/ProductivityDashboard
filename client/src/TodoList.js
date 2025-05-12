import { useState, useEffect } from 'react';
import { Check, Trash, Plus } from 'lucide-react';

export default function TodoList({ isAuthenticated }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load todos from backend if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    } else {
      // Load from localStorage if not authenticated
      const savedTodos = localStorage.getItem('localTodos');
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
    }
  }, [isAuthenticated]);

  // Save todos to localStorage when they change (for non-authenticated users)
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('localTodos', JSON.stringify(todos));
    }
  }, [todos, isAuthenticated]);

  const fetchTodos = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/todos', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const todoItem = {
      id: isAuthenticated ? null : Date.now().toString(),
      text: newTodo,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    if (isAuthenticated) {
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ text: newTodo }),
        });
        
        if (response.ok) {
          const savedTodo = await response.json();
          setTodos(prev => [...prev, savedTodo]);
        }
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    } else {
      // Just update local state for non-authenticated users
      setTodos(prev => [...prev, todoItem]);
    }
    
    setNewTodo('');
  };

  const toggleTodoCompletion = async (id) => {
    const todoToUpdate = todos.find(todo => todo.id === id);
    if (!todoToUpdate) return;
    
    const updatedTodo = { ...todoToUpdate, completed: !todoToUpdate.completed };
    
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatedTodo),
        });
        
        if (response.ok) {
          setTodos(todos.map(todo => 
            todo.id === id ? updatedTodo : todo
          ));
        }
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    } else {
      // Just update local state for non-authenticated users
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    }
  };

  const deleteTodo = async (id) => {
    if (isAuthenticated) {
      try {
        const response = await fetch(`/api/todos/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          setTodos(todos.filter(todo => todo.id !== id));
        }
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    } else {
      // Just update local state for non-authenticated users
      setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading todos...</div>;
  }

  return (
    <div className="p-6 h-full">
      <h2 className="text-2xl font-bold mb-6">To-Do List</h2>
      
      <form onSubmit={handleAddTodo} className="mb-6 flex">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          <Plus size={18} />
          <span className="ml-1">Add</span>
        </button>
      </form>
      
      {todos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tasks yet. Add one to get started!
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.map(todo => (
            <li 
              key={todo.id}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
            >
              <div className="flex items-center flex-1">
                <button
                  onClick={() => toggleTodoCompletion(todo.id)}
                  className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-400'
                  }`}
                >
                  {todo.completed && <Check size={14} />}
                </button>
                <span className={`ml-3 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  {todo.text}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {!isAuthenticated && todos.length > 0 && (
        <div className="mt-6 text-sm text-gray-600 bg-yellow-100 p-3 rounded">
          Note: Your tasks are saved locally. Log in to sync across devices.
        </div>
      )}
    </div>
  );
}