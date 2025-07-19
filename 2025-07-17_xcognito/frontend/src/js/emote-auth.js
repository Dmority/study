// Emote Authentication Service
class EmoteAuthService {
    constructor() {
        this.userPool = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.initializeCognito();
    }

    // Initialize AWS Cognito User Pool for Emote Service
    initializeCognito() {
        // Check if SDK is available
        if (typeof AmazonCognitoIdentity === 'undefined' || !window.AmazonCognitoIdentity) {
            debugLog('AWS Cognito SDK not loaded yet for emote service, waiting...');
            setTimeout(() => {
                this.initializeCognito();
            }, 200);
            return;
        }

        try {
            // Verify SDK has required classes
            if (!AmazonCognitoIdentity.CognitoUserPool) {
                debugLog('CognitoUserPool class not available for emote service, waiting...');
                setTimeout(() => {
                    this.initializeCognito();
                }, 200);
                return;
            }

            const poolData = {
                UserPoolId: EMOTE_CONFIG.userPoolId,
                ClientId: EMOTE_CONFIG.userPoolClientId
            };

            this.userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            this.currentUser = this.userPool.getCurrentUser();
            this.isInitialized = true;

            debugLog('Emote Cognito initialized successfully', {
                userPoolId: EMOTE_CONFIG.userPoolId,
                clientId: EMOTE_CONFIG.userPoolClientId
            });
        } catch (error) {
            console.error('Failed to initialize Emote Cognito:', error);
            debugLog('Emote Cognito initialization failed', error.message);
            
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

        debugLog('Waiting for Emote Cognito initialization...');

        while (!this.isInitialized && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
            
            if (waited % 1000 === 0) {
                debugLog(`Still waiting for Emote Cognito initialization... (${waited/1000}s)`);
            }
        }

        if (!this.isInitialized) {
            debugLog('Emote Cognito initialization timeout details', {
                waited: waited,
                maxWait: maxWait,
                sdkLoaded: typeof AmazonCognitoIdentity !== 'undefined',
                hasUserPool: !!this.userPool
            });
            throw new Error('Emote Cognito initialization timeout after ' + (waited/1000) + ' seconds');
        }

        debugLog('Emote Cognito initialization successful after ' + (waited/1000) + ' seconds');
        return true;
    }

    // Sign up user in emote service (for first-time users)
    async signUp(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Signing up emote user', { email });

            const attributeList = [
                new AmazonCognitoIdentity.CognitoUserAttribute({
                    Name: 'email',
                    Value: email
                })
            ];

            this.userPool.signUp(email, password, attributeList, null, (err, result) => {
                if (err) {
                    debugLog('Emote sign up error', err.message);
                    reject(err);
                    return;
                }

                debugLog('Emote sign up successful', { username: result.user.getUsername() });
                resolve({
                    user: result.user,
                    userConfirmed: result.userConfirmed
                });
            });
        });
    }

    // Sign in user using credentials from Todo app
    async signInWithCredentials(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.ensureInitialized();
            } catch (error) {
                reject(error);
                return;
            }

            debugLog('Signing in emote user', { email });

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
                onSuccess: (result) => {
                    debugLog('Emote sign in successful');
                    this.currentUser = cognitoUser;
                    
                    const idToken = result.getIdToken().getJwtToken();
                    
                    // Set auth token for emote API client
                    if (window.emoteApiClient) {
                        window.emoteApiClient.setAuthToken(idToken);
                    }

                    resolve({
                        idToken,
                        user: cognitoUser
                    });
                },
                onFailure: (err) => {
                    debugLog('Emote sign in error', err.message);
                    reject(err);
                },
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    debugLog('Emote new password required', { userAttributes, requiredAttributes });
                    reject(new Error('New password required for emote service. Please use the password reset flow.'));
                }
            });
        });
    }

    // Get current ID token
    getIdToken() {
        try {
            if (!this.currentUser) {
                debugLog('No current emote user for ID token');
                return null;
            }

            // Get the session synchronously (if cached)
            const session = this.currentUser.getSignInUserSession();
            if (session && session.isValid()) {
                const idToken = session.getIdToken().getJwtToken();
                debugLog('Emote ID token retrieved successfully');
                return idToken;
            } else {
                debugLog('No valid emote session found for ID token');
                return null;
            }
        } catch (error) {
            debugLog('Error getting emote ID token', error.message);
            return null;
        }
    }

    // Sign out user
    async signOut() {
        return new Promise((resolve) => {
            if (!this.currentUser) {
                resolve();
                return;
            }

            debugLog('Signing out emote user');

            this.currentUser.signOut(() => {
                this.currentUser = null;
                
                // Clear auth token from emote API client
                if (window.emoteApiClient) {
                    window.emoteApiClient.setAuthToken(null);
                }

                debugLog('Emote sign out successful');
                resolve();
            });
        });
    }

    // Check if user is authenticated
    async isAuthenticated() {
        try {
            if (!this.currentUser) {
                return false;
            }

            return new Promise((resolve) => {
                this.currentUser.getSession((err, session) => {
                    if (err) {
                        debugLog('Emote session check error', err.message);
                        resolve(false);
                        return;
                    }

                    if (session && session.isValid()) {
                        debugLog('Emote session is valid');
                        resolve(true);
                    } else {
                        debugLog('Emote session is invalid');
                        resolve(false);
                    }
                });
            });
        } catch (error) {
            debugLog('Error checking emote authentication', error.message);
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Try to authenticate with same credentials as Todo user (without password)
    async tryAutomaticAuthentication() {
        try {
            // Check if we're already authenticated
            if (await this.isAuthenticated()) {
                return true;
            }

            // If not authenticated, we need fresh login
            // For security, we don't store passwords, so we can't auto-authenticate
            debugLog('Emotion User Pool authentication requires fresh login');
            return false;
        } catch (error) {
            debugLog('Automatic authentication failed', error.message);
            return false;
        }
    }

    // OIDC認証フローを使用してTodo User PoolからEmotion User Poolのトークンを取得
    async authenticateWithOIDCFlow() {
        try {
            debugLog('Starting OIDC authentication flow');
            
            // ステップ1: 認証要求のURLを生成
            const authUrl = this.generateAuthorizationUrl();
            
            // ステップ2: 新しいウィンドウで認証要求を開く
            const authWindow = window.open(authUrl, 'emoteAuth', 'width=500,height=600');
            
            // ステップ3: 認証コードを待つ
            const authCode = await this.waitForAuthorizationCode(authWindow);
            
            // ステップ4: 認証コードをトークンに交換
            const tokens = await this.exchangeCodeForTokens(authCode);
            
            // ステップ5: トークンを設定
            this.setTokensFromOIDC(tokens);
            
            debugLog('OIDC authentication flow completed successfully');
            return true;
            
        } catch (error) {
            debugLog('OIDC authentication flow failed', error.message);
            throw error;
        }
    }

    // 認証要求URLを生成
    generateAuthorizationUrl() {
        const authParams = new URLSearchParams({
            response_type: 'code',
            client_id: EMOTE_CONFIG.userPoolClientId,
            redirect_uri: `${window.location.origin}/auth-callback.html`,
            scope: 'openid profile email',
            identity_provider: 'TodoUserPoolOIDC',
            state: this.generateRandomState()
        });

        return `https://cognito-idp.us-east-1.amazonaws.com/${EMOTE_CONFIG.userPoolId}/oauth2/authorize?${authParams}`;
    }

    // ランダムなstateを生成
    generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // 認証コードを待つ
    waitForAuthorizationCode(authWindow) {
        return new Promise((resolve, reject) => {
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    reject(new Error('Authentication window was closed'));
                    return;
                }

                try {
                    const url = authWindow.location.href;
                    if (url.includes('code=')) {
                        const urlParams = new URLSearchParams(authWindow.location.search);
                        const code = urlParams.get('code');
                        
                        authWindow.close();
                        clearInterval(checkClosed);
                        
                        if (code) {
                            resolve(code);
                        } else {
                            reject(new Error('No authorization code received'));
                        }
                    }
                } catch (e) {
                    // Cross-origin エラーは無視（まだ認証中）
                }
            }, 1000);

            // 5分でタイムアウト
            setTimeout(() => {
                clearInterval(checkClosed);
                if (!authWindow.closed) {
                    authWindow.close();
                }
                reject(new Error('Authentication timeout'));
            }, 5 * 60 * 1000);
        });
    }

    // 認証コードをトークンに交換
    async exchangeCodeForTokens(code) {
        const tokenEndpoint = `https://cognito-idp.us-east-1.amazonaws.com/${EMOTE_CONFIG.userPoolId}/oauth2/token`;
        
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${window.location.origin}/auth-callback.html`,
            client_id: EMOTE_CONFIG.userPoolClientId
        });

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        const tokens = await response.json();
        debugLog('Token exchange successful', { hasAccessToken: !!tokens.access_token, hasIdToken: !!tokens.id_token });
        return tokens;
    }

    // OIDCトークンを設定
    setTokensFromOIDC(tokens) {
        // Cognitoユーザーセッションを手動で作成
        if (tokens.id_token && tokens.access_token) {
            const idToken = new AmazonCognitoIdentity.CognitoIdToken({ IdToken: tokens.id_token });
            const accessToken = new AmazonCognitoIdentity.CognitoAccessToken({ AccessToken: tokens.access_token });
            const refreshToken = tokens.refresh_token ? 
                new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: tokens.refresh_token }) : null;

            const sessionData = {
                IdToken: idToken,
                AccessToken: accessToken,
                RefreshToken: refreshToken
            };

            const cognitoUserSession = new AmazonCognitoIdentity.CognitoUserSession(sessionData);
            
            // 仮のユーザーオブジェクトを作成
            const userData = {
                Username: 'oidc-user',
                Pool: this.userPool
            };
            
            this.currentUser = new AmazonCognitoIdentity.CognitoUser(userData);
            this.currentUser.setSignInUserSession(cognitoUserSession);
            
            debugLog('OIDC tokens set successfully');
        }
    }

    // Authenticate with Todo User Pool credentials by creating/authenticating Emotion User Pool user
    async authenticateWithTodoCredentials(email, password) {
        try {
            await this.ensureInitialized();
            
            debugLog('Attempting to authenticate with Emotion User Pool using Todo credentials');
            
            // First, try to sign in with existing credentials
            try {
                const result = await this.signInWithCredentials(email, password);
                debugLog('Successfully signed in to Emotion User Pool');
                return result;
            } catch (signInError) {
                debugLog('Sign in failed, checking if user needs to be created', signInError.message);
                
                // If user doesn't exist, create them in the Emotion User Pool
                if (signInError.code === 'UserNotFoundException' || signInError.message.includes('User does not exist')) {
                    try {
                        debugLog('Creating user in Emotion User Pool');
                        await this.signUp(email, password);
                        
                        // After signup, try to sign in again
                        debugLog('User created, attempting sign in');
                        const result = await this.signInWithCredentials(email, password);
                        return result;
                    } catch (signUpError) {
                        debugLog('Failed to create user in Emotion User Pool', signUpError.message);
                        throw signUpError;
                    }
                } else {
                    throw signInError;
                }
            }
        } catch (error) {
            debugLog('Emotion User Pool authentication failed', error.message);
            throw error;
        }
    }

    // Ensure user is registered and authenticated in emote service
    async ensureUserRegisteredAndAuthenticated(email, password) {
        try {
            // First try to sign in
            debugLog('Attempting to sign in to emote service');
            const result = await this.signInWithCredentials(email, password);
            return result;
        } catch (signInError) {
            debugLog('Sign in failed, checking if user needs to be registered', signInError.message);
            
            // If user doesn't exist, try to register them
            if (signInError.code === 'UserNotFoundException' || signInError.message.includes('User does not exist')) {
                try {
                    debugLog('User not found, registering new user in emote service');
                    await this.signUp(email, password);
                    
                    // After signup, try to sign in again
                    debugLog('Registration successful, attempting sign in');
                    const result = await this.signInWithCredentials(email, password);
                    return result;
                } catch (signUpError) {
                    debugLog('Registration failed', signUpError.message);
                    throw signUpError;
                }
            } else {
                // Other sign in errors
                throw signInError;
            }
        }
    }
}

// Create global emote auth service instance after DOM loads
let emoteAuthService = null;

// Initialize emote auth service when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        debugLog('Creating EmoteAuthService instance on DOMContentLoaded');
        emoteAuthService = new EmoteAuthService();
        debugLog('EmoteAuthService created successfully');
    });
} else {
    debugLog('Creating EmoteAuthService instance immediately');
    emoteAuthService = new EmoteAuthService();
    debugLog('EmoteAuthService created successfully');
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmoteAuthService;
} else {
    window.EmoteAuthService = EmoteAuthService;
    window.emoteAuthService = emoteAuthService;
}