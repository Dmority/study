// AWS Configuration
const AWS_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_3qvjUY9s4',
    userPoolClientId: '125i53k4ken5kkd3bs0bg66en3',
    apiEndpoint: 'https://13j8o5dxq2.execute-api.us-east-1.amazonaws.com/prod'
};

// Emote Backend Configuration
const EMOTE_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_f3slFAP9U',
    userPoolClientId: '540grdub64bqb0u36gfvrg4p4q',
    apiEndpoint: 'https://56aqgp74wi.execute-api.us-east-1.amazonaws.com/dev'
};

// App Configuration
const APP_CONFIG = {
    appName: 'Todo Management App',
    version: '1.0.0',
    debug: true // Temporarily enabled for debugging
};

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AWS_CONFIG, EMOTE_CONFIG, APP_CONFIG };
} else {
    window.AWS_CONFIG = AWS_CONFIG;
    window.EMOTE_CONFIG = EMOTE_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
}

// Helper function to log debug messages
function debugLog(message, data = null) {
    if (APP_CONFIG.debug) {
        console.log(`[${APP_CONFIG.appName}] ${message}`, data || '');
    }
}

// Make debugLog available globally
window.debugLog = debugLog;