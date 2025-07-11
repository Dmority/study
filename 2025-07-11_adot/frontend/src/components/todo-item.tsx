import { Todo, TodoStatus } from '@/types/todo';
import { toggleTodoAction, deleteTodoAction } from '@/app/actions/todo-actions';

interface TodoItemProps {
  todo: Todo;
}

function getStatusColor(status: TodoStatus): string {
  switch (status) {
    case TodoStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case TodoStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-800';
    case TodoStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function TodoItem({ todo }: TodoItemProps) {
  const isCompleted = todo.status === TodoStatus.COMPLETED;
  const statusColor = getStatusColor(todo.status);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
              {todo.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {todo.status.replace('_', ' ')}
            </span>
          </div>
          {todo.description && (
            <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
              {todo.description}
            </p>
          )}
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span>Created: {new Date(todo.created_at).toLocaleDateString()}</span>
            {todo.updated_at !== todo.created_at && (
              <span className="ml-4">Updated: {new Date(todo.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <form action={toggleTodoAction}>
            <input type="hidden" name="id" value={todo.id} />
            <input type="hidden" name="status" value={todo.status} />
            <button
              type="submit"
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                todo.status === TodoStatus.PENDING 
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : todo.status === TodoStatus.IN_PROGRESS
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {todo.status === TodoStatus.PENDING ? 'Start' : 
               todo.status === TodoStatus.IN_PROGRESS ? 'Complete' : 'Reset'}
            </button>
          </form>
          
          <form action={deleteTodoAction}>
            <input type="hidden" name="id" value={todo.id} />
            <button
              type="submit"
              className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}