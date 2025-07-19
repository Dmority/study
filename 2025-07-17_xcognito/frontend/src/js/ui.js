// UI Helper Functions and Form Validation
class UIHelper {
    constructor() {
        this.messageTimeout = null;
    }

    // Show message to user
    showMessage(message, type = 'info', duration = 5000) {
        const messageContainer = document.getElementById('messageContainer');
        const messageContent = document.getElementById('messageContent');
        
        if (!messageContainer || !messageContent) {
            console.warn('Message container not found');
            return;
        }

        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        // Set message
        messageContainer.className = `message ${type}`;
        messageContent.textContent = message;
        messageContainer.classList.remove('hidden');

        // Auto-hide after duration
        this.messageTimeout = setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, duration);

        debugLog(`Message shown: ${type}`, message);
    }

    // Show/hide loading indicator
    showLoading(show = true) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.classList.remove('hidden');
            } else {
                loadingIndicator.classList.add('hidden');
            }
        }
    }

    // Form validation
    validateForm(formElement, rules) {
        const errors = [];
        const formData = new FormData(formElement);

        for (const [fieldName, fieldRules] of Object.entries(rules)) {
            const value = formData.get(fieldName);
            const fieldErrors = this.validateField(fieldName, value, fieldRules, formElement);
            errors.push(...fieldErrors);
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: Object.fromEntries(formData)
        };
    }

    // Validate individual field
    validateField(fieldName, value, rules, formElement) {
        const errors = [];

        for (const rule of rules) {
            const error = this.applyValidationRule(fieldName, value, rule, formElement);
            if (error) {
                errors.push({
                    fieldName: fieldName,
                    message: error
                });
            }
        }

        return errors;
    }

    // Apply validation rule
    applyValidationRule(fieldName, value, rule, formElement) {
        const displayName = this.getFieldDisplayName(fieldName);

        switch (rule.type) {
            case 'required':
                if (!value || value.trim() === '') {
                    return `${displayName} is required`;
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    return `${displayName} must be a valid email address`;
                }
                break;

            case 'minLength':
                if (value && value.length < rule.value) {
                    return `${displayName} must be at least ${rule.value} characters`;
                }
                break;

            case 'maxLength':
                if (value && value.length > rule.value) {
                    return `${displayName} must not exceed ${rule.value} characters`;
                }
                break;

            case 'pattern':
                if (value && !rule.value.test(value)) {
                    return rule.message || `${displayName} format is invalid`;
                }
                break;

            case 'match':
                let matchValue = '';
                if (formElement) {
                    const matchElement = formElement.querySelector(`[name="${rule.field}"]`);
                    matchValue = matchElement ? matchElement.value : '';
                } else {
                    const matchElement = document.querySelector(`[name="${rule.field}"]`);
                    matchValue = matchElement ? matchElement.value : '';
                }
                if (value !== matchValue) {
                    return rule.message || `${displayName} must match ${this.getFieldDisplayName(rule.field)}`;
                }
                break;

            case 'custom':
                const customResult = rule.validator(value);
                if (customResult !== true) {
                    return customResult;
                }
                break;
        }

        return null;
    }

    // Get display name for field
    getFieldDisplayName(fieldName) {
        const displayNames = {
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            verificationCode: 'Verification Code',
            title: 'Title',
            description: 'Description',
            dueDate: 'Due Date'
        };

        return displayNames[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }

    // Show field error
    showFieldError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        // Remove existing error
        this.clearFieldError(fieldName);

        // Add error class
        field.classList.add('error');

        // Create error element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.dataset.field = fieldName;

        // Insert error after field
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    // Clear field error
    clearFieldError(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.remove('error');
        }

        const errorElement = document.querySelector(`[data-field="${fieldName}"]`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Clear all field errors
    clearAllFieldErrors() {
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(element => element.remove());

        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    // Toggle form visibility
    toggleAuthForms(showForm) {
        const forms = ['loginForm', 'signupForm', 'verificationForm', 'forgotPasswordForm', 'resetPasswordForm'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                if (formId === showForm) {
                    form.classList.remove('hidden');
                } else {
                    form.classList.add('hidden');
                }
            }
        });

        // Clear any existing errors when switching forms
        this.clearAllFieldErrors();
    }

    // Modal helpers
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format date for input
    formatDateForInput(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    // Check if date is overdue
    isOverdue(dueDateString) {
        if (!dueDateString) return false;
        
        const dueDate = new Date(dueDateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dueDate < today;
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showMessage('Copied to clipboard!', 'success', 2000);
        } catch (error) {
            debugLog('Failed to copy to clipboard', error);
            this.showMessage('Failed to copy to clipboard', 'error');
        }
    }

    // Scroll to element
    scrollToElement(element, offset = 0) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    // Generate random ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Local storage helpers
    setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            debugLog('Failed to set localStorage', error);
        }
    }

    getLocalStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            debugLog('Failed to get localStorage', error);
            return defaultValue;
        }
    }

    removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            debugLog('Failed to remove localStorage', error);
        }
    }
}

// Validation rules
const VALIDATION_RULES = {
    login: {
        email: [
            { type: 'required' },
            { type: 'email' }
        ],
        password: [
            { type: 'required' }
        ]
    },
    signup: {
        email: [
            { type: 'required' },
            { type: 'email' }
        ],
        password: [
            { type: 'required' },
            { type: 'minLength', value: 8 },
            { 
                type: 'pattern', 
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
            }
        ],
        confirmPassword: [
            { type: 'required' },
            { type: 'match', field: 'password', message: 'Passwords do not match' }
        ]
    },
    verification: {
        verificationCode: [
            { type: 'required' },
            { type: 'pattern', value: /^\d{6}$/, message: 'Verification code must be 6 digits' }
        ]
    },
    forgotPassword: {
        email: [
            { type: 'required' },
            { type: 'email' }
        ]
    },
    resetPassword: {
        resetCode: [
            { type: 'required' },
            { type: 'pattern', value: /^\d{6}$/, message: 'Reset code must be 6 digits' }
        ],
        newPassword: [
            { type: 'required' },
            { type: 'minLength', value: 8 },
            { 
                type: 'pattern', 
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
            }
        ],
        confirmNewPassword: [
            { type: 'required' },
            { type: 'match', field: 'newPassword', message: 'Passwords do not match' }
        ]
    },
    todo: {
        title: [
            { type: 'required' },
            { type: 'maxLength', value: 100 }
        ],
        description: [
            { type: 'maxLength', value: 500 }
        ]
    }
};

// Create global UI helper instance
const uiHelper = new UIHelper();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIHelper, VALIDATION_RULES };
} else {
    window.UIHelper = UIHelper;
    window.VALIDATION_RULES = VALIDATION_RULES;
    window.uiHelper = uiHelper;
}