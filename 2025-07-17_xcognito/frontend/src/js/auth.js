// This file handles AWS Cognito authentication
class AuthService {
    constructor() {
        this.userPool = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.initializeCognito();
    }

    // Initialize AWS Cognito User Pool
    initializeCognito() {
        // Check if SDK is available
        if (typeof AmazonCognitoIdentity === 'undefined' || !window.AmazonCognitoIdentity) {
            debugLog('AWS Cognito SDK not loaded yet, waiting...');
            setTimeout(() => {
                this.initializeCognito();
            }, 200);
            return;
        }

        try {
            // Verify SDK has required classes
            if (!AmazonCognitoIdentity.CognitoUserPool) {
                debugLog('CognitoUserPool class not available, waiting...');
                setTimeout(() => {
                    this.initializeCognito();
                }, 200);
                return;
            }

            const poolData = {
                UserPoolId: AWS_CONFIG.userPoolId,
                ClientId: AWS_CONFIG.userPoolClientId
            };

            this.userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            this.currentUser = this.userPool.getCurrentUser();
            this.isInitialized = true;

            debugLog('Cognito initialized successfully', {
                userPoolId: AWS_CONFIG.userPoolId,
                clientId: AWS_CONFIG.userPoolClientId,
                sdkVersion: AmazonCognitoIdentity.VERSION || 'unknown'
            });
        } catch (error) {
            console.error('Failed to initialize Cognito:', error);
            debugLog('Cognito initialization failed', error.message);
            
            // Retry initialization after a delay
            setTimeout(() => {
                this.initializeCognito();
            }, 1000);
        }
    }

    // Ensure Cognito is initialized
    async ensureInitialized() {
        if (this.isInitialized) {
            return true;
        }

        // Wait for initialization with timeout
        const maxWait = 10000; // 10 seconds
        const checkInterval = 200; // 200ms
        let waited = 0;

        debugLog('Waiting for Cognito initialization...');

        while (!this.isInitialized && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
            
            if (waited % 1000 === 0) {
                debugLog(`Still waiting for Cognito initialization... (${waited/1000}s)`);
            }
        }

        if (!this.isInitialized) {
            debugLog('Cognito initialization timeout details', {
                waited: waited,
                maxWait: maxWait,
                sdkLoaded: typeof AmazonCognitoIdentity !== 'undefined',
                hasUserPool: !!this.userPool
            });
            throw new Error('Cognito initialization timeout after ' + (waited/1000) + ' seconds');
        }

        debugLog('Cognito initialization successful after ' + (waited/1000) + ' seconds');
        return true;
    }

    // Sign up new user
    async signUp(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Signing up user', { email });

            const attributeList = [
                new AmazonCognitoIdentity.CognitoUserAttribute({
                    Name: 'email',
                    Value: email
                })
            ];

            this.userPool.signUp(email, password, attributeList, null, (err, result) => {
                if (err) {
                    debugLog('Sign up error', err.message);
                    reject(err);
                    return;
                }

                debugLog('Sign up successful', { username: result.user.getUsername() });
                resolve({
                    user: result.user,
                    userConfirmed: result.userConfirmed
                });
            });
        });
    }

    // Confirm user registration
    async confirmSignUp(username, verificationCode) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Confirming sign up', { username });

            const userData = {
                Username: username,
                Pool: this.userPool
            };

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

            cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
                if (err) {
                    debugLog('Confirmation error', err.message);
                    reject(err);
                    return;
                }

                debugLog('Confirmation successful', result);
                resolve(result);
            });
        });
    }

    // Resend confirmation code
    async resendConfirmationCode(username) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            const userData = {
                Username: username,
                Pool: this.userPool
            };

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

            cognitoUser.resendConfirmationCode((err, result) => {
                if (err) {
                    debugLog('Resend confirmation error', err.message);
                    reject(err);
                    return;
                }

                debugLog('Resend confirmation successful', result);
                resolve(result);
            });
        });
    }

    // Sign in user
    async signIn(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Signing in user', { email });

            const userData = {
                Username: email,
                Pool: this.userPool
            };

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

            const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                Username: email,
                Password: password
            });

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: async (result) => {
                    debugLog('Sign in successful');
                    this.currentUser = cognitoUser;
                    
                    const accessToken = result.getAccessToken().getJwtToken();
                    const idToken = result.getIdToken().getJwtToken();
                    
                    // Set auth token for API clients
                    if (window.apiClient) {
                        window.apiClient.setAuthToken(idToken);
                    }

                    // Authenticate with Emotion User Pool if available
                    if (window.emoteAuthService) {
                        try {
                            debugLog('Attempting to authenticate with Emotion User Pool');
                            await window.emoteAuthService.authenticateWithTodoCredentials(email, password);
                            debugLog('Emotion User Pool authentication successful');
                        } catch (emoteError) {
                            debugLog('Emotion User Pool authentication failed', emoteError.message);
                            // Don't fail the main login if emotion service fails
                        }
                    }

                    resolve({
                        accessToken,
                        idToken,
                        user: cognitoUser
                    });
                },
                onFailure: (err) => {
                    debugLog('Sign in error', err.message);
                    reject(err);
                },
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    debugLog('New password required', { userAttributes, requiredAttributes });
                    reject(new Error('New password required. Please use the password reset flow.'));
                },
                mfaRequired: (challengeName, challengeParameters) => {
                    debugLog('MFA required', { challengeName, challengeParameters });
                    reject(new Error('MFA required. This is not currently supported.'));
                },
                customChallenge: (challengeParameters) => {
                    debugLog('Custom challenge', challengeParameters);
                    reject(new Error('Custom challenge not supported.'));
                }
            });
        });
    }

    // Get current session
    async getCurrentSession() {
        return new Promise((resolve, reject) => {
            if (!this.currentUser) {
                reject(new Error('No current user'));
                return;
            }

            this.currentUser.getSession((err, session) => {
                if (err) {
                    debugLog('Get session error', err.message);
                    reject(err);
                    return;
                }

                if (session.isValid()) {
                    debugLog('Session is valid');
                    
                    // Set auth token for API clients
                    if (window.apiClient) {
                        window.apiClient.setAuthToken(session.getIdToken().getJwtToken());
                    }
                    // Note: Don't set emoteApiClient token here - it should use Emotion User Pool token

                    resolve(session);
                } else {
                    debugLog('Session is invalid');
                    reject(new Error('Session is invalid'));
                }
            });
        });
    }

    // Get user attributes
    async getUserAttributes() {
        return new Promise((resolve, reject) => {
            if (!this.currentUser) {
                reject(new Error('No current user'));
                return;
            }

            this.currentUser.getUserAttributes((err, attributes) => {
                if (err) {
                    debugLog('Get attributes error', err.message);
                    reject(err);
                    return;
                }

                const userAttributes = {};
                attributes.forEach(attribute => {
                    userAttributes[attribute.Name] = attribute.Value;
                });

                debugLog('User attributes retrieved', userAttributes);
                resolve(userAttributes);
            });
        });
    }

    // Get current access token
    getAccessToken() {
        try {
            if (!this.currentUser) {
                debugLog('No current user for access token');
                return null;
            }

            // Get the session synchronously (if cached)
            const session = this.currentUser.getSignInUserSession();
            if (session && session.isValid()) {
                const accessToken = session.getAccessToken().getJwtToken();
                debugLog('Access token retrieved successfully');
                return accessToken;
            } else {
                debugLog('No valid session found for access token');
                return null;
            }
        } catch (error) {
            debugLog('Error getting access token', error.message);
            return null;
        }
    }

    // Get current ID token
    getIdToken() {
        try {
            if (!this.currentUser) {
                debugLog('No current user for ID token');
                return null;
            }

            // Get the session synchronously (if cached)
            const session = this.currentUser.getSignInUserSession();
            if (session && session.isValid()) {
                const idToken = session.getIdToken().getJwtToken();
                debugLog('ID token retrieved successfully');
                return idToken;
            } else {
                debugLog('No valid session found for ID token');
                return null;
            }
        } catch (error) {
            debugLog('Error getting ID token', error.message);
            return null;
        }
    }

    // Sign out user
    async signOut() {
        return new Promise(async (resolve) => {
            if (!this.currentUser) {
                resolve();
                return;
            }

            debugLog('Signing out user');

            this.currentUser.signOut(async () => {
                this.currentUser = null;
                
                // Clear auth token from API clients
                if (window.apiClient) {
                    window.apiClient.setAuthToken(null);
                }
                if (window.emoteApiClient) {
                    window.emoteApiClient.setAuthToken(null);
                }

                // Also sign out from emotion service if available
                if (window.emoteAuthService) {
                    try {
                        debugLog('Signing out from emotion service');
                        await window.emoteAuthService.signOut();
                        debugLog('Emotion service sign out successful');
                    } catch (emoteError) {
                        debugLog('Emotion service sign out failed', emoteError.message);
                        // Don't fail the main logout if emotion service fails
                    }
                }

                debugLog('Sign out successful');
                resolve();
            });
        });
    }

    // Forgot password
    async forgotPassword(email) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Initiating password reset', { email });

            const userData = {
                Username: email,
                Pool: this.userPool
            };

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

            cognitoUser.forgotPassword({
                onSuccess: (result) => {
                    debugLog('Password reset initiated', result);
                    resolve(result);
                },
                onFailure: (err) => {
                    debugLog('Password reset error', err.message);
                    reject(err);
                }
            });
        });
    }

    // Confirm password reset
    async confirmPassword(username, verificationCode, newPassword) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Confirming password reset', { username });

            const userData = {
                Username: username,
                Pool: this.userPool
            };

            const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

            cognitoUser.confirmPassword(verificationCode, newPassword, {
                onSuccess: (result) => {
                    debugLog('Password reset confirmed', result);
                    resolve(result);
                },
                onFailure: (err) => {
                    debugLog('Password reset confirmation error', err.message);
                    reject(err);
                }
            });
        });
    }

    // Check if user is authenticated
    async isAuthenticated() {
        try {
            await this.getCurrentSession();
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current user email for emotion authentication
    async getCurrentUserEmail() {
        try {
            const attributes = await this.getUserAttributes();
            return attributes.email;
        } catch (error) {
            debugLog('Failed to get user email', error.message);
            return null;
        }
    }
}

// Create global auth service instance after DOM loads
let authService = null;

// Initialize auth service when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authService = new AuthService();
    });
} else {
    authService = new AuthService();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
} else {
    window.AuthService = AuthService;
    window.authService = authService;
}