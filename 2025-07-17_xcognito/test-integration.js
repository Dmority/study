// Test script to verify OIDC federation between todo and emote backends

// Configuration
const TODO_USER_POOL_ID = 'us-east-1_yNgvsE3q1';
const TODO_CLIENT_ID = '68ur269ci0dngnqdugat7tfqsn';
const EMOTE_API_URL = 'https://56aqgp74wi.execute-api.us-east-1.amazonaws.com/dev';
const TODO_API_URL = 'https://ef3upqh8g7.execute-api.us-east-1.amazonaws.com/dev';

// You would need to provide test credentials
const TEST_EMAIL = 'test@example.com';  // Replace with actual test user
const TEST_PASSWORD = 'TestPassword123!';  // Replace with actual password

async function testAuthentication() {
    console.log('🔐 Testing Todo Cognito Authentication...');
    
    try {
        // This would require aws-sdk cognito-idp client to authenticate
        console.log('Note: This test requires real user credentials and aws-sdk setup');
        console.log('Manual testing steps:');
        console.log('1. Open browser to: http://localhost:8080/public/index.html');
        console.log('2. Login with todo credentials');
        console.log('3. Navigate to dashboard');
        console.log('4. Check browser console for auth token');
        console.log('5. Try clicking "Get Random Emotion" button');
        console.log('6. Verify if emote backend responds with emotion data');
        
        return null;
    } catch (error) {
        console.error('Authentication test failed:', error.message);
        return null;
    }
}

async function testEmoteEndpoint(token) {
    if (!token) {
        console.log('⚠️  No token available - skipping emote endpoint test');
        return;
    }
    
    console.log('🎭 Testing Emote Backend with Todo token...');
    
    try {
        
        const response = await fetch(`${EMOTE_API_URL}/emotion`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Emote endpoint responded successfully!');
            console.log('Response:', data);
        } else {
            console.log('❌ Emote endpoint failed:', data);
        }
    } catch (error) {
        console.error('❌ Emote endpoint test error:', error.message);
    }
}

async function testTodoEndpoint(token) {
    if (!token) {
        console.log('⚠️  No token available - skipping todo endpoint test');
        return;
    }
    
    console.log('📝 Testing Todo Backend with token...');
    
    try {
        
        const response = await fetch(`${TODO_API_URL}/todos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Todo endpoint responded successfully!');
            console.log('Response:', data);
        } else {
            console.log('❌ Todo endpoint failed:', data);
        }
    } catch (error) {
        console.error('❌ Todo endpoint test error:', error.message);
    }
}

async function main() {
    console.log('🧪 Starting OIDC Federation Integration Test\n');
    
    // Test authentication
    const token = await testAuthentication();
    
    console.log('\n📋 Manual Test Instructions:');
    console.log('1. Make sure frontend server is running: http://localhost:8080');
    console.log('2. Open browser and navigate to: http://localhost:8080/public/index.html');
    console.log('3. Login with todo credentials');
    console.log('4. Check browser console for debug logs');
    console.log('5. On dashboard, try "Get Random Emotion" button');
    console.log('6. Check if emotion is displayed - this confirms OIDC federation works!');
    
    console.log('\n🔍 What to look for:');
    console.log('- No CORS errors');
    console.log('- Successful auth token setup for emote client');
    console.log('- Emotion API calls succeed (not 401 Unauthorized)');
    console.log('- Emotion data displays in UI');
    
    console.log('\n🚀 Frontend URL: http://localhost:8080/public/index.html');
}

main().catch(console.error);