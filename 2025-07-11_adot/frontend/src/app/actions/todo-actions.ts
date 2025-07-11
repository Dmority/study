'use server';

import { revalidatePath } from 'next/cache';
import { createTodo, updateTodo, deleteTodo } from '@/lib/todos';
import { TodoStatus } from '@/types/todo';

export async function createTodoAction(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  if (!title) {
    throw new Error('Title is required');
  }
  
  await createTodo({ title, description });
  revalidatePath('/');
}

export async function updateTodoAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as TodoStatus;
  
  await updateTodo(id, { title, description, status });
  revalidatePath('/');
}

export async function deleteTodoAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  await deleteTodo(id);
  revalidatePath('/');
}

export async function toggleTodoAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  const currentStatus = formData.get('status') as TodoStatus;
  
  // Status progression: pending -> in_progress -> completed -> pending
  let newStatus: TodoStatus;
  switch (currentStatus) {
    case TodoStatus.PENDING:
      newStatus = TodoStatus.IN_PROGRESS;
      break;
    case TodoStatus.IN_PROGRESS:
      newStatus = TodoStatus.COMPLETED;
      break;
    case TodoStatus.COMPLETED:
      newStatus = TodoStatus.PENDING;
      break;
    default:
      newStatus = TodoStatus.PENDING;
  }
  
  await updateTodo(id, { status: newStatus });
  revalidatePath('/');
}