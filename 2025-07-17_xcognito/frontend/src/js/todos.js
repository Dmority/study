class TodoManager {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.currentSort = 'createdAt';
        this.isLoading = false;
    }

    // Load todos from API
    async loadTodos() {
        try {
            this.setLoading(true);
            debugLog('Loading todos from API');

            const response = await apiClient.getTodos();
            this.todos = response.data || [];
            
            debugLog('Todos loaded successfully', this.todos.length + ' todos');
            this.renderTodos();
            
            return this.todos;
        } catch (error) {
            debugLog('Error loading todos', error.message);
            this.showMessage('Failed to load todos: ' + error.message, 'error');
            return [];
        } finally {
            this.setLoading(false);
        }
    }

    // Add new todo
    async addTodo(todoData) {
        try {
            this.setLoading(true);
            debugLog('Adding new todo', todoData);

            const response = await apiClient.createTodo(todoData);
            const newTodo = response.data;
            
            this.todos.unshift(newTodo);
            this.renderTodos();
            
            debugLog('Todo added successfully', newTodo);
            this.showMessage('Todo added successfully!', 'success');
            
            return newTodo;
        } catch (error) {
            debugLog('Error adding todo', error.message);
            this.showMessage('Failed to add todo: ' + error.message, 'error');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // Update todo
    async updateTodo(todoId, updates) {
        try {
            this.setLoading(true);
            debugLog('Updating todo', { todoId, updates });

            const response = await apiClient.updateTodo(todoId, updates);
            const updatedTodo = response.data;
            
            const index = this.todos.findIndex(todo => todo.todoId === todoId);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.renderTodos();
            }
            
            debugLog('Todo updated successfully', updatedTodo);
            this.showMessage('Todo updated successfully!', 'success');
            
            return updatedTodo;
        } catch (error) {
            debugLog('Error updating todo', error.message);
            this.showMessage('Failed to update todo: ' + error.message, 'error');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // Delete todo
    async deleteTodo(todoId) {
        try {
            this.setLoading(true);
            debugLog('Deleting todo', todoId);

            await apiClient.deleteTodo(todoId);
            
            this.todos = this.todos.filter(todo => todo.todoId !== todoId);
            this.renderTodos();
            
            debugLog('Todo deleted successfully', todoId);
            this.showMessage('Todo deleted successfully!', 'success');
            
        } catch (error) {
            debugLog('Error deleting todo', error.message);
            this.showMessage('Failed to delete todo: ' + error.message, 'error');
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // Toggle todo completion
    async toggleTodoCompletion(todoId) {
        const todo = this.todos.find(t => t.todoId === todoId);
        if (!todo) return;

        const updates = {
            completed: !todo.completed
        };

        await this.updateTodo(todoId, updates);
    }

    // Filter todos
    filterTodos(filter) {
        this.currentFilter = filter;
        debugLog('Filtering todos', filter);
        this.renderTodos();
    }

    // Sort todos
    sortTodos(sortBy) {
        this.currentSort = sortBy;
        debugLog('Sorting todos', sortBy);
        this.renderTodos();
    }

    // Get filtered and sorted todos
    getFilteredAndSortedTodos() {
        let filteredTodos = [...this.todos];

        // Apply filter
        switch (this.currentFilter) {
            case 'pending':
                filteredTodos = filteredTodos.filter(todo => !todo.completed);
                break;
            case 'completed':
                filteredTodos = filteredTodos.filter(todo => todo.completed);
                break;
            default:
                // 'all' - no filtering
                break;
        }

        // Apply sort
        filteredTodos.sort((a, b) => {
            switch (this.currentSort) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'createdAt':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filteredTodos;
    }

    // Render todos to DOM
    renderTodos() {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        
        if (!todoList || !emptyState) return;

        const filteredTodos = this.getFilteredAndSortedTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
        
        // Add event listeners to new elements
        this.attachTodoEventListeners();
    }

    // Create HTML element for a todo
    createTodoElement(todo) {
        const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '';
        const createdAt = new Date(todo.createdAt).toLocaleDateString();
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.todoId}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-title">${this.escapeHtml(todo.title)}</div>
                    ${todo.description ? `<div class="todo-description">${this.escapeHtml(todo.description)}</div>` : ''}
                    <div class="todo-meta">
                        <span>Created: ${createdAt}</span>
                        ${dueDate ? `<span class="${isOverdue ? 'overdue' : ''}">Due: ${dueDate}</span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn btn-edit" data-action="edit">Edit</button>
                    <button class="btn btn-delete" data-action="delete">Delete</button>
                </div>
            </div>
        `;
    }

    // Attach event listeners to todo elements
    attachTodoEventListeners() {
        const todoItems = document.querySelectorAll('.todo-item');
        
        todoItems.forEach(item => {
            const todoId = item.dataset.todoId;
            
            // Checkbox toggle
            const checkbox = item.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => {
                this.toggleTodoCompletion(todoId);
            });

            // Edit button
            const editBtn = item.querySelector('[data-action="edit"]');
            editBtn.addEventListener('click', () => {
                this.openEditModal(todoId);
            });

            // Delete button
            const deleteBtn = item.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', () => {
                this.openDeleteModal(todoId);
            });
        });
    }

    // Open edit modal
    openEditModal(todoId) {
        const todo = this.todos.find(t => t.todoId === todoId);
        if (!todo) return;

        debugLog('Opening edit modal for todo', todo);

        // Populate form
        document.getElementById('editTodoTitle').value = todo.title;
        document.getElementById('editTodoDescription').value = todo.description || '';
        document.getElementById('editTodoDueDate').value = todo.dueDate || '';
        document.getElementById('editTodoCompleted').checked = todo.completed;

        // Store current todo ID
        const modal = document.getElementById('editTodoModal');
        modal.dataset.todoId = todoId;

        // Show modal
        modal.classList.remove('hidden');
    }

    // Open delete modal
    openDeleteModal(todoId) {
        const todo = this.todos.find(t => t.todoId === todoId);
        if (!todo) return;

        debugLog('Opening delete modal for todo', todo);

        // Set todo title in modal
        document.getElementById('deleteTodoTitle').textContent = todo.title;

        // Store current todo ID
        const modal = document.getElementById('deleteTodoModal');
        modal.dataset.todoId = todoId;

        // Show modal
        modal.classList.remove('hidden');
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            if (isLoading) {
                loadingIndicator.classList.remove('hidden');
            } else {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer');
        const messageContent = document.getElementById('messageContent');
        
        if (!messageContainer || !messageContent) return;

        messageContainer.className = `message ${type}`;
        messageContent.textContent = message;
        messageContainer.classList.remove('hidden');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 5000);
    }

    // Get todo by ID
    getTodoById(todoId) {
        return this.todos.find(todo => todo.todoId === todoId);
    }

    // Get todos count
    getTodosCount() {
        return {
            total: this.todos.length,
            completed: this.todos.filter(todo => todo.completed).length,
            pending: this.todos.filter(todo => !todo.completed).length
        };
    }
}

// Create global todo manager instance
const todoManager = new TodoManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoManager;
} else {
    window.TodoManager = TodoManager;
    window.todoManager = todoManager;
}