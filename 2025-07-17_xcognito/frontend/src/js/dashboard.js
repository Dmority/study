// Dashboard application script
class DashboardApp {
    constructor() {
        this.currentUser = null;
        this.isSubmitting = false;
        this.init();
    }

    async init() {
        debugLog('Initializing DashboardApp');
        
        try {
            await this.checkAuthStatus();
            await this.loadUserInfo();
            await this.loadTodos();
            this.setupEmoteApiClient();
            this.setupEventListeners();
        } catch (error) {
            debugLog('Dashboard initialization failed', error.message);
            this.redirectToLogin();
        }
    }

    // Check authentication status
    async checkAuthStatus() {
        try {
            const isAuthenticated = await authService.isAuthenticated();
            if (!isAuthenticated) {
                throw new Error('User not authenticated');
            }
            
            this.currentUser = authService.getCurrentUser();
            debugLog('User authenticated', this.currentUser);
        } catch (error) {
            debugLog('Authentication check failed', error.message);
            throw error;
        }
    }

    // Load user information
    async loadUserInfo() {
        try {
            const attributes = await authService.getUserAttributes();
            const email = attributes.email || 'User';
            
            document.getElementById('userName').textContent = email;
            debugLog('User info loaded', attributes);
        } catch (error) {
            debugLog('Failed to load user info', error.message);
            document.getElementById('userName').textContent = 'User';
        }
    }

    // Setup emote API client
    async setupEmoteApiClient() {
        try {
            // Debug what's actually available
            debugLog('Checking emote auth service availability...', {
                windowEmoteAuthService: !!window.emoteAuthService,
                globalEmoteAuthService: typeof emoteAuthService !== 'undefined' ? !!emoteAuthService : 'undefined',
                EmoteAuthServiceClass: typeof EmoteAuthService !== 'undefined' ? 'available' : 'undefined'
            });
            
            // Check if emote auth service is available
            if (!window.emoteAuthService) {
                // Try to create it if the class is available
                if (typeof EmoteAuthService !== 'undefined') {
                    debugLog('Creating EmoteAuthService instance as fallback');
                    window.emoteAuthService = new EmoteAuthService();
                } else {
                    debugLog('Emote auth service not available, emotion features will require user action');
                    return;
                }
            }

            // Try automatic authentication first
            const isEmoteAuthenticated = await window.emoteAuthService.tryAutomaticAuthentication();
            
            if (isEmoteAuthenticated) {
                // Use the Emotion User Pool token for emote API
                const token = window.emoteAuthService.getIdToken();
                if (token) {
                    emoteApiClient.setAuthToken(token);
                    debugLog('Emote API client configured with existing Emotion User Pool token');
                }
            } else {
                debugLog('Emotion User Pool not authenticated - will prompt user when needed');
                // Don't show any message here - we'll handle it when they try to use the features
            }
        } catch (error) {
            debugLog('Failed to setup emote API client', error.message);
        }
    }

    // Load todos
    async loadTodos() {
        try {
            await todoManager.loadTodos();
            this.updateTodoStats();
        } catch (error) {
            debugLog('Failed to load todos', error.message);
            uiHelper.showMessage('Failed to load todos: ' + error.message, 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Add todo form
        document.getElementById('addTodoForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            // Additional check to prevent duplicate submissions
            if (this.isSubmitting) {
                debugLog('Form submit event blocked - already submitting');
                return;
            }
            this.handleAddTodo(e.target);
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterChange(e.target);
            });
        });

        // Sort dropdown
        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.handleSortChange(e.target.value);
        });

        // Edit modal
        document.getElementById('editModalSave')?.addEventListener('click', () => {
            this.handleEditTodo();
        });

        document.getElementById('editModalCancel')?.addEventListener('click', () => {
            this.hideEditModal();
        });

        document.getElementById('editModalClose')?.addEventListener('click', () => {
            this.hideEditModal();
        });

        // Delete modal
        document.getElementById('deleteModalConfirm')?.addEventListener('click', () => {
            this.handleDeleteTodo();
        });

        document.getElementById('deleteModalCancel')?.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('deleteModalClose')?.addEventListener('click', () => {
            this.hideDeleteModal();
        });

        // Emote buttons
        document.getElementById('getEmotionBtn')?.addEventListener('click', () => {
            this.handleGetRandomEmotion();
        });

        document.getElementById('getAllEmotionsBtn')?.addEventListener('click', () => {
            this.handleGetAllEmotions();
        });

        // Emotions modal close buttons
        document.getElementById('emotionsModalClose')?.addEventListener('click', () => {
            this.hideEmotionsModal();
        });

        document.getElementById('emotionsModalClose2')?.addEventListener('click', () => {
            this.hideEmotionsModal();
        });

        // Message close button
        document.getElementById('messageClose')?.addEventListener('click', () => {
            document.getElementById('messageContainer')?.classList.add('hidden');
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideEditModal();
                this.hideDeleteModal();
                this.hideEmotionsModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEditModal();
                this.hideDeleteModal();
                this.hideEmotionsModal();
            }
        });
    }

    // Handle logout
    async handleLogout() {
        try {
            uiHelper.showLoading(true);
            await authService.signOut();
            
            debugLog('Logout successful');
            uiHelper.showMessage('Logged out successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            debugLog('Logout failed', error.message);
            uiHelper.showMessage('Logout failed: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Handle add todo
    async handleAddTodo(form) {
        // Prevent multiple submissions
        if (this.isSubmitting) {
            debugLog('Form submission already in progress, ignoring');
            return;
        }

        const validation = uiHelper.validateForm(form, VALIDATION_RULES.todo);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            this.isSubmitting = true;
            uiHelper.clearAllFieldErrors();
            
            // Disable submit button
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Adding...';
            }
            
            // Failsafe timeout to reset flag after 10 seconds
            const timeoutId = setTimeout(() => {
                if (this.isSubmitting) {
                    debugLog('Submission timeout - resetting flag');
                    this.isSubmitting = false;
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Add Todo';
                    }
                }
            }, 10000);
            
            const todoData = {
                title: validation.data.title,
                description: validation.data.description || '',
                dueDate: validation.data.dueDate || null
            };

            await todoManager.addTodo(todoData);
            
            // Clear timeout since we succeeded
            clearTimeout(timeoutId);
            
            // Reset form
            form.reset();
            this.updateTodoStats();
            
        } catch (error) {
            debugLog('Add todo failed', error.message);
        } finally {
            this.isSubmitting = false;
            
            // Re-enable submit button
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Add Todo';
            }
        }
    }

    // Handle filter change
    handleFilterChange(button) {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Apply filter
        const filter = button.dataset.filter;
        todoManager.filterTodos(filter);
        this.updateTodoStats();
    }

    // Handle sort change
    handleSortChange(sortBy) {
        todoManager.sortTodos(sortBy);
    }

    // Handle edit todo
    async handleEditTodo() {
        const modal = document.getElementById('editTodoModal');
        const todoId = modal.dataset.todoId;
        
        if (!todoId) {
            uiHelper.showMessage('No todo selected for editing', 'error');
            return;
        }

        const formData = {
            title: document.getElementById('editTodoTitle').value,
            description: document.getElementById('editTodoDescription').value,
            dueDate: document.getElementById('editTodoDueDate').value || null,
            completed: document.getElementById('editTodoCompleted').checked
        };

        // Validate form data
        const validation = uiHelper.validateForm(document.getElementById('editTodoForm'), VALIDATION_RULES.todo);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            await todoManager.updateTodo(todoId, formData);
            this.hideEditModal();
            this.updateTodoStats();
        } catch (error) {
            debugLog('Edit todo failed', error.message);
        }
    }

    // Handle delete todo
    async handleDeleteTodo() {
        const modal = document.getElementById('deleteTodoModal');
        const todoId = modal.dataset.todoId;
        
        if (!todoId) {
            uiHelper.showMessage('No todo selected for deletion', 'error');
            return;
        }

        try {
            await todoManager.deleteTodo(todoId);
            this.hideDeleteModal();
            this.updateTodoStats();
        } catch (error) {
            debugLog('Delete todo failed', error.message);
        }
    }

    // Show/hide modals
    hideEditModal() {
        uiHelper.hideModal('editTodoModal');
        uiHelper.clearAllFieldErrors();
    }

    hideDeleteModal() {
        uiHelper.hideModal('deleteTodoModal');
    }

    hideEmotionsModal() {
        uiHelper.hideModal('allEmotionsModal');
    }

    // Update todo statistics
    updateTodoStats() {
        const stats = todoManager.getTodosCount();
        debugLog('Todo stats updated', stats);
        
        // Update filter button labels with counts
        const allBtn = document.querySelector('[data-filter="all"]');
        const pendingBtn = document.querySelector('[data-filter="pending"]');
        const completedBtn = document.querySelector('[data-filter="completed"]');
        
        if (allBtn) allBtn.textContent = `All (${stats.total})`;
        if (pendingBtn) pendingBtn.textContent = `Pending (${stats.pending})`;
        if (completedBtn) completedBtn.textContent = `Completed (${stats.completed})`;
    }

    // Show validation errors
    showValidationErrors(errors) {
        uiHelper.clearAllFieldErrors();
        
        debugLog('Validation errors:', errors);
        
        errors.forEach(error => {
            if (typeof error === 'object' && error.fieldName && error.message) {
                uiHelper.showFieldError(error.fieldName, error.message);
            } else {
                // Fallback for string errors
                const fieldName = error.split(' ')[0].toLowerCase();
                uiHelper.showFieldError(fieldName, error);
            }
        });

        uiHelper.showMessage('Please correct the errors below.', 'error');
    }

    // Redirect to login
    redirectToLogin() {
        uiHelper.showMessage('Please log in to continue', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    // Ensure emote authentication is available
    async ensureEmoteAuthentication() {
        try {
            // Check if emote auth service is available
            if (!window.emoteAuthService) {
                throw new Error('Emote authentication service not available');
            }

            // Check if already authenticated
            const isAuthenticated = await window.emoteAuthService.isAuthenticated();
            if (isAuthenticated) {
                const token = window.emoteAuthService.getIdToken();
                if (token) {
                    emoteApiClient.setAuthToken(token);
                    debugLog('Emote authentication already valid');
                    return;
                }
            }

            // Need to authenticate - prompt for password
            await this.promptEmoteAuthentication();
            
            // Set the token after successful authentication
            const token = window.emoteAuthService.getIdToken();
            if (token) {
                emoteApiClient.setAuthToken(token);
                debugLog('Emote API client configured with new token');
            }
            
        } catch (error) {
            debugLog('Failed to ensure emote authentication', error.message);
            throw error;
        }
    }

    // Prompt user to authenticate with Emote User Pool using OIDC flow
    async promptEmoteAuthentication() {
        try {
            debugLog('Starting OIDC authentication flow for Emote User Pool');
            
            // OIDCフローを使用してEmotion User Poolの認証を行う
            const result = await window.emoteAuthService.authenticateWithOIDCFlow();
            
            if (result) {
                debugLog('OIDC authentication successful');
                return result;
            } else {
                throw new Error('OIDC authentication failed');
            }
        } catch (error) {
            debugLog('OIDC authentication failed', error.message);
            
            // フォールバック: 従来のパスワードプロンプト方式
            return this.promptEmoteAuthenticationFallback();
        }
    }

    // フォールバック用の従来のパスワードプロンプト方式
    async promptEmoteAuthenticationFallback() {
        return new Promise((resolve, reject) => {
            // Get current user email
            authService.getCurrentUserEmail().then(email => {
                if (!email) {
                    reject(new Error('Could not get user email'));
                    return;
                }

                // Create a simple password prompt as fallback
                const password = prompt(
                    `OIDC authentication not available. Please enter your password for ${email}:`
                );

                if (!password) {
                    reject(new Error('Password required for emotion features'));
                    return;
                }

                // Authenticate with Emote User Pool
                debugLog('Attempting Emote User Pool authentication with provided password (fallback)');
                window.emoteAuthService.authenticateWithTodoCredentials(email, password)
                    .then(result => {
                        debugLog('Emote User Pool authentication successful (fallback)');
                        resolve(result);
                    })
                    .catch(error => {
                        debugLog('Emote User Pool authentication failed (fallback)', error.message);
                        reject(error);
                    });
            }).catch(error => {
                reject(error);
            });
        });
    }

    // Refresh todos
    async refreshTodos() {
        try {
            await this.loadTodos();
            uiHelper.showMessage('Todos refreshed!', 'success', 2000);
        } catch (error) {
            debugLog('Refresh failed', error.message);
            uiHelper.showMessage('Failed to refresh todos', 'error');
        }
    }

    // Export todos (future feature)
    exportTodos() {
        const todos = todoManager.todos;
        const dataStr = JSON.stringify(todos, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'todos-export.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        uiHelper.showMessage('Todos exported successfully!', 'success');
    }

    // Handle get random emotion
    async handleGetRandomEmotion() {
        try {
            uiHelper.showLoading(true);
            debugLog('Getting random emotion from emote backend');
            
            // Check if emote API client has a token
            if (!emoteApiClient.authToken) {
                debugLog('No emote auth token, attempting re-authentication');
                await this.ensureEmoteAuthentication();
            }
            
            const response = await emoteApiClient.getRandomEmotion();
            
            if (response.success && response.data) {
                this.displayEmotion(response.data.emotion, response.timestamp);
                uiHelper.showMessage('New emotion received!', 'success', 2000);
            } else {
                throw new Error('Invalid response from emote service');
            }
            
        } catch (error) {
            debugLog('Failed to get random emotion', error.message);
            
            // If it's an authentication error, try re-authentication
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                try {
                    debugLog('Authentication error detected, attempting re-authentication');
                    await this.ensureEmoteAuthentication();
                    
                    // Retry the request
                    const response = await emoteApiClient.getRandomEmotion();
                    if (response.success && response.data) {
                        this.displayEmotion(response.data.emotion, response.timestamp);
                        uiHelper.showMessage('New emotion received!', 'success', 2000);
                        return;
                    }
                } catch (retryError) {
                    debugLog('Re-authentication failed', retryError.message);
                }
            }
            
            uiHelper.showMessage('Failed to get emotion: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Handle get all emotions
    async handleGetAllEmotions() {
        try {
            uiHelper.showLoading(true);
            debugLog('Getting all emotions from emote backend');
            
            // Check if emote API client has a token
            if (!emoteApiClient.authToken) {
                debugLog('No emote auth token, attempting re-authentication');
                await this.ensureEmoteAuthentication();
            }
            
            const response = await emoteApiClient.getAllEmotions();
            
            if (response.success && response.data && response.data.emotions) {
                this.displayAllEmotions(response.data.emotions);
                uiHelper.showModal('allEmotionsModal');
            } else {
                throw new Error('Invalid response from emote service');
            }
            
        } catch (error) {
            debugLog('Failed to get all emotions', error.message);
            
            // If it's an authentication error, try re-authentication
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                try {
                    debugLog('Authentication error detected, attempting re-authentication');
                    await this.ensureEmoteAuthentication();
                    
                    // Retry the request
                    const response = await emoteApiClient.getAllEmotions();
                    if (response.success && response.data && response.data.emotions) {
                        this.displayAllEmotions(response.data.emotions);
                        uiHelper.showModal('allEmotionsModal');
                        return;
                    }
                } catch (retryError) {
                    debugLog('Re-authentication failed', retryError.message);
                }
            }
            
            uiHelper.showMessage('Failed to get emotions: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Display single emotion
    displayEmotion(emotion, timestamp) {
        const emoteText = document.getElementById('emoteText');
        const emoteTimestamp = document.getElementById('emoteTimestamp');
        
        if (emoteText) {
            emoteText.textContent = `Your emotion: ${emotion}`;
        }
        
        if (emoteTimestamp && timestamp) {
            const date = new Date(timestamp);
            emoteTimestamp.textContent = `Generated at: ${date.toLocaleString()}`;
        }
        
        debugLog('Emotion displayed', { emotion, timestamp });
    }

    // Display all emotions in modal
    displayAllEmotions(emotions) {
        const emotionsGrid = document.getElementById('emotionsGrid');
        
        if (!emotionsGrid) {
            debugLog('Emotions grid element not found');
            return;
        }
        
        emotionsGrid.innerHTML = '';
        
        emotions.forEach(emotion => {
            const emotionCard = document.createElement('div');
            emotionCard.className = 'emotion-card';
            emotionCard.innerHTML = `
                <div class="emotion-name">${emotion}</div>
                <div class="emotion-icon">😊</div>
            `;
            
            // Add click handler to select emotion
            emotionCard.addEventListener('click', () => {
                this.displayEmotion(emotion, new Date().toISOString());
                this.hideEmotionsModal();
                uiHelper.showMessage(`Selected emotion: ${emotion}`, 'success', 2000);
            });
            
            emotionsGrid.appendChild(emotionCard);
        });
        
        debugLog('All emotions displayed', { count: emotions.length });
    }
}

// Make dashboard app globally accessible
window.dashboardApp = null;

// Initialize dashboard app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded, initializing DashboardApp');
    window.dashboardApp = new DashboardApp();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add todo
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const addForm = document.getElementById('addTodoForm');
        if (addForm && window.dashboardApp && !window.dashboardApp.isSubmitting) {
            addForm.requestSubmit();
        }
    }
    
    // Ctrl/Cmd + R to refresh todos
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (window.dashboardApp) {
            window.dashboardApp.refreshTodos();
        }
    }
});