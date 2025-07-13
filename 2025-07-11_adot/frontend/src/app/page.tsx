import { getTodos } from '@/lib/todos';
import TodoForm from '@/components/todo-form';
import TodoItem from '@/components/todo-item';
import { TodoStatus, Todo } from '@/types/todo';

// Force dynamic rendering to avoid API calls during static generation
export const dynamic = 'force-dynamic';

export default async function Home() {
  let todos: Todo[] = [];
  let error: string | null = null;
  
  try {
    todos = await getTodos();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch todos';
  }
  
  const completedTodos = todos.filter(todo => todo.status === TodoStatus.COMPLETED);
  const inProgressTodos = todos.filter(todo => todo.status === TodoStatus.IN_PROGRESS);
  const pendingTodos = todos.filter(todo => todo.status === TodoStatus.PENDING);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Todo Application
        </h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-center">
              ⚠️ Unable to connect to backend API: {error}
            </p>
            <p className="text-red-600 text-center text-sm mt-2">
              Make sure the backend server is running on http://localhost:8000
            </p>
          </div>
        )}
        
        <TodoForm />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Pending Tasks ({pendingTodos.length})
            </h2>
            {pendingTodos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending tasks</p>
            ) : (
              <div>
                {pendingTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              In Progress ({inProgressTodos.length})
            </h2>
            {inProgressTodos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks in progress</p>
            ) : (
              <div>
                {inProgressTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Completed Tasks ({completedTodos.length})
            </h2>
            {completedTodos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed tasks</p>
            ) : (
              <div>
                {completedTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
