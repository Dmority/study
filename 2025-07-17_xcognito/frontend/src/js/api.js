class ApiClient {
    constructor() {
        this.baseUrl = AWS_CONFIG.apiEndpoint;
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
        debugLog('Auth token set', token ? 'Token present' : 'Token cleared');
    }

    async makeRequest(method, endpoint, data = null) {
        debugLog(`Making ${method} request to ${endpoint}`, data);
        
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = this.authToken;
        }

        const config = {
            method,
            headers,
            mode: 'cors'
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            debugLog(`${method} ${endpoint} - Success`, responseData);
            return responseData;
        } catch (error) {
            debugLog(`${method} ${endpoint} - Error`, error.message);
            throw error;
        }
    }

    // Todo API methods
    async getTodos() {
        return await this.makeRequest('GET', '/todos');
    }

    async createTodo(todoData) {
        return await this.makeRequest('POST', '/todos', todoData);
    }

    async updateTodo(todoId, todoData) {
        return await this.makeRequest('PUT', `/todos/${todoId}`, todoData);
    }

    async deleteTodo(todoId) {
        return await this.makeRequest('DELETE', `/todos/${todoId}`);
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                mode: 'cors'
            });
            return response.ok;
        } catch (error) {
            debugLog('Health check failed', error.message);
            return false;
        }
    }
}

class EmoteApiClient {
    constructor() {
        this.baseUrl = EMOTE_CONFIG.apiEndpoint;
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
        debugLog('Emote auth token set', token ? 'Token present' : 'Token cleared');
    }

    async makeRequest(method, endpoint) {
        debugLog(`Making ${method} request to emote endpoint ${endpoint}`);
        
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = this.authToken;
        }

        const config = {
            method,
            headers,
            mode: 'cors'
        };

        try {
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            debugLog(`${method} ${endpoint} - Success`, responseData);
            return responseData;
        } catch (error) {
            debugLog(`${method} ${endpoint} - Error`, error.message);
            throw error;
        }
    }

    // Emote API methods
    async getRandomEmotion() {
        return await this.makeRequest('GET', '/emotion');
    }

    async getAllEmotions() {
        return await this.makeRequest('GET', '/emotions');
    }
}

// Create global API client instances
const apiClient = new ApiClient();
const emoteApiClient = new EmoteApiClient();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, EmoteApiClient };
} else {
    window.ApiClient = ApiClient;
    window.EmoteApiClient = EmoteApiClient;
    window.apiClient = apiClient;
    window.emoteApiClient = emoteApiClient;
}