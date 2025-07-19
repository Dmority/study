// Main application script for authentication pages
class AuthApp {
    constructor() {
        this.currentForm = 'login';
        this.pendingUser = null;
        this.init();
    }

    init() {
        debugLog('Initializing AuthApp');
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    // Check if user is already authenticated
    async checkAuthStatus() {
        try {
            // Wait for auth service to be available
            let attempts = 0;
            const maxAttempts = 20;
            
            while (!authService && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!authService) {
                debugLog('Auth service not available');
                return;
            }
            
            const isAuthenticated = await authService.isAuthenticated();
            if (isAuthenticated) {
                debugLog('User is authenticated, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            debugLog('User is not authenticated', error.message);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Form navigation links
        document.getElementById('showSignupLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('signup');
        });

        document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });

        document.getElementById('showForgotPasswordLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('forgotPassword');
        });

        document.getElementById('backToLoginLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });

        document.getElementById('resendCodeLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.resendVerificationCode();
        });

        // Form submissions
        document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });

        document.getElementById('signupFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup(e.target);
        });

        document.getElementById('verificationFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVerification(e.target);
        });

        document.getElementById('forgotPasswordFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleForgotPassword(e.target);
        });

        document.getElementById('resetPasswordFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleResetPassword(e.target);
        });

        // Message close button
        document.getElementById('messageClose')?.addEventListener('click', () => {
            document.getElementById('messageContainer')?.classList.add('hidden');
        });
    }

    // Show specific form
    showForm(formName) {
        this.currentForm = formName;
        uiHelper.toggleAuthForms(`${formName}Form`);
        debugLog(`Switched to ${formName} form`);
    }

    // Handle login
    async handleLogin(form) {
        const validation = uiHelper.validateForm(form, VALIDATION_RULES.login);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            uiHelper.showLoading(true);
            uiHelper.clearAllFieldErrors();

            const result = await authService.signIn(validation.data.email, validation.data.password);
            
            debugLog('Login successful', result);
            uiHelper.showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            debugLog('Login failed', error.message);
            let errorMessage = 'Login failed: ' + error.message;
            if (error.message.includes('Incorrect username or password')) {
                errorMessage += ' If you just verified your email, please wait a moment and try again.';
            }
            uiHelper.showMessage(errorMessage, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Handle signup
    async handleSignup(form) {
        const validation = uiHelper.validateForm(form, VALIDATION_RULES.signup);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            uiHelper.showLoading(true);
            uiHelper.clearAllFieldErrors();

            const result = await authService.signUp(validation.data.email, validation.data.password);
            
            this.pendingUser = {
                username: result.user.getUsername(),
                email: validation.data.email
            };

            debugLog('Signup successful', result);
            
            if (result.userConfirmed) {
                uiHelper.showMessage('Account created successfully! You can now sign in.', 'success');
                this.showForm('login');
            } else {
                uiHelper.showMessage('Account created! Please check your email for verification code.', 'info');
                this.showForm('verification');
            }

        } catch (error) {
            debugLog('Signup failed', error.message);
            uiHelper.showMessage('Signup failed: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Handle email verification
    async handleVerification(form) {
        const validation = uiHelper.validateForm(form, VALIDATION_RULES.verification);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        if (!this.pendingUser) {
            uiHelper.showMessage('No pending verification found. Please sign up first.', 'error');
            this.showForm('signup');
            return;
        }

        try {
            uiHelper.showLoading(true);
            uiHelper.clearAllFieldErrors();

            await authService.confirmSignUp(this.pendingUser.username, validation.data.verificationCode);
            
            debugLog('Verification successful');
            uiHelper.showMessage('Email verified successfully! Please wait a moment for your account to be fully activated, then you can sign in.', 'success');
            this.showForm('login');
            this.pendingUser = null;

        } catch (error) {
            debugLog('Verification failed', error.message);
            uiHelper.showMessage('Verification failed: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Handle forgot password
    async handleForgotPassword(form) {
        const validation = uiHelper.validateForm(form, VALIDATION_RULES.forgotPassword);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            uiHelper.showLoading(true);
            uiHelper.clearAllFieldErrors();

            await authService.forgotPassword(validation.data.email);
            
            this.pendingUser = {
                username: validation.data.email,
                email: validation.data.email
            };

            debugLog('Password reset initiated');
            uiHelper.showMessage('Password reset code sent to your email!', 'success');
            this.showForm('resetPassword');

        } catch (error) {
            debugLog('Forgot password failed', error.message);
            uiHelper.showMessage('Failed to send reset code: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Handle password reset
    async handleResetPassword(form) {
        const validation = uiHelper.validateForm(form, VALIDATION_RULES.resetPassword);
        
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        if (!this.pendingUser) {
            uiHelper.showMessage('No pending password reset found. Please initiate password reset first.', 'error');
            this.showForm('forgotPassword');
            return;
        }

        try {
            uiHelper.showLoading(true);
            uiHelper.clearAllFieldErrors();

            await authService.confirmPassword(
                this.pendingUser.username,
                validation.data.resetCode,
                validation.data.newPassword
            );
            
            debugLog('Password reset successful');
            uiHelper.showMessage('Password reset successful! You can now sign in with your new password.', 'success');
            this.showForm('login');
            this.pendingUser = null;

        } catch (error) {
            debugLog('Password reset failed', error.message);
            uiHelper.showMessage('Password reset failed: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
    }

    // Resend verification code
    async resendVerificationCode() {
        if (!this.pendingUser) {
            uiHelper.showMessage('No pending verification found. Please sign up first.', 'error');
            this.showForm('signup');
            return;
        }

        try {
            uiHelper.showLoading(true);

            await authService.resendConfirmationCode(this.pendingUser.username);
            
            debugLog('Verification code resent');
            uiHelper.showMessage('Verification code resent to your email!', 'success');

        } catch (error) {
            debugLog('Resend verification failed', error.message);
            uiHelper.showMessage('Failed to resend verification code: ' + error.message, 'error');
        } finally {
            uiHelper.showLoading(false);
        }
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded, initializing AuthApp');
    new AuthApp();
});

// Add CSS for field errors
const style = document.createElement('style');
style.textContent = `
    .field-error {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
        display: block;
    }
    
    .error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1) !important;
    }
    
    .overdue {
        color: #dc3545;
        font-weight: 500;
    }
`;
document.head.appendChild(style);