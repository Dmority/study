const AWS = require('aws-sdk');

// Predefined list of emotions
const EMOTIONS = [
    'Good',
    'Happy',
    'Excited',
    'Calm',
    'Energetic',
    'Peaceful',
    'Joyful',
    'Optimistic',
    'Relaxed',
    'Confident',
    'Motivated',
    'Cheerful',
    'Content',
    'Inspired',
    'Focused',
    'Grateful',
    'Hopeful',
    'Balanced',
    'Refreshed',
    'Positive'
];

// CORS headers for API Gateway
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

// Success response helper
function successResponse(data) {
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        })
    };
}

// Error response helper
function errorResponse(statusCode, message) {
    return {
        statusCode: statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        })
    };
}

// Get random emotion
function getRandomEmotion() {
    const randomIndex = Math.floor(Math.random() * EMOTIONS.length);
    return EMOTIONS[randomIndex];
}

// Main Lambda handler
exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        // Handle CORS preflight requests
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        // Extract user information from Cognito authorizer
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) {
            return errorResponse(401, 'Unauthorized: Invalid token');
        }

        // Get user email for logging
        const userEmail = event.requestContext?.authorizer?.claims?.email || 'unknown';
        console.log('User accessing emote service:', { userId, userEmail });

        // Route based on path
        const path = event.path;
        const method = event.httpMethod;

        if (path === '/emotion' && method === 'GET') {
            // Return single random emotion
            const emotion = getRandomEmotion();
            return successResponse({
                emotion: emotion,
                userId: userId
            });
        } else if (path === '/emotions' && method === 'GET') {
            // Return list of all available emotions
            return successResponse({
                emotions: EMOTIONS,
                count: EMOTIONS.length
            });
        } else {
            return errorResponse(404, 'Not Found');
        }

    } catch (error) {
        console.error('Error processing request:', error);
        return errorResponse(500, 'Internal Server Error');
    }
};