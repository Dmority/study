#!/usr/bin/env node

// Simple test to verify sign-up functionality
const https = require('https');

const AWS_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yNgvsE3q1',
    userPoolClientId: '68ur269ci0dngnqdugat7tfqsn'
};

async function testSignUp() {
    console.log('🧪 Testing Sign-Up Functionality');
    console.log('================================');
    
    // Test 1: Check if Cognito User Pool exists
    console.log('1. Testing Cognito User Pool accessibility...');
    
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`   Test email: ${testEmail}`);
    console.log(`   Test password: ${testPassword}`);
    
    // Create the sign-up request payload
    const payload = {
        ClientId: AWS_CONFIG.userPoolClientId,
        Username: testEmail,
        Password: testPassword,
        UserAttributes: [
            {
                Name: 'email',
                Value: testEmail
            }
        ]
    };
    
    const postData = JSON.stringify(payload);
    
    const options = {
        hostname: `cognito-idp.${AWS_CONFIG.region}.amazonaws.com`,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
            'Content-Length': postData.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   Response status: ${res.statusCode}`);
                console.log(`   Response headers:`, res.headers);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log('   ✅ Sign-up successful!');
                        console.log(`   User Sub: ${result.UserSub}`);
                        console.log(`   User confirmed: ${result.UserConfirmed}`);
                        
                        if (!result.UserConfirmed) {
                            console.log('   📧 Email verification required');
                        }
                        
                        resolve(result);
                    } catch (error) {
                        console.log('   ❌ Failed to parse response:', error.message);
                        console.log('   Raw response:', data);
                        reject(error);
                    }
                } else {
                    try {
                        const error = JSON.parse(data);
                        console.log(`   ❌ Sign-up failed: ${error.message || error.__type}`);
                        console.log(`   Error code: ${error.__type}`);
                        reject(new Error(error.message || error.__type));
                    } catch (parseError) {
                        console.log('   ❌ Failed to parse error response:', data);
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('   ❌ Request error:', error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function testExistingUser() {
    console.log('\n2. Testing existing user login...');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    console.log(`   Test email: ${testEmail}`);
    
    const payload = {
        ClientId: AWS_CONFIG.userPoolClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
            USERNAME: testEmail,
            PASSWORD: testPassword
        }
    };
    
    const postData = JSON.stringify(payload);
    
    const options = {
        hostname: `cognito-idp.${AWS_CONFIG.region}.amazonaws.com`,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
            'Content-Length': postData.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   Response status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log('   ✅ Login successful!');
                        console.log(`   Challenge Name: ${result.ChallengeName || 'None'}`);
                        if (result.AuthenticationResult) {
                            console.log(`   Access Token: ${result.AuthenticationResult.AccessToken.substring(0, 50)}...`);
                        }
                        resolve(result);
                    } catch (error) {
                        console.log('   ❌ Failed to parse response:', error.message);
                        console.log('   Raw response:', data);
                        reject(error);
                    }
                } else {
                    try {
                        const error = JSON.parse(data);
                        console.log(`   ❌ Login failed: ${error.message || error.__type}`);
                        console.log(`   Error code: ${error.__type}`);
                        reject(new Error(error.message || error.__type));
                    } catch (parseError) {
                        console.log('   ❌ Failed to parse error response:', data);
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('   ❌ Request error:', error.message);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log(`Configuration:`);
    console.log(`  Region: ${AWS_CONFIG.region}`);
    console.log(`  User Pool ID: ${AWS_CONFIG.userPoolId}`);
    console.log(`  Client ID: ${AWS_CONFIG.userPoolClientId}`);
    console.log('');
    
    try {
        // Test sign-up
        await testSignUp();
        
        // Test existing user login
        await testExistingUser();
        
        console.log('\n🎉 All tests completed!');
        console.log('\nNext steps:');
        console.log('1. Open http://localhost:8080/public/index.html');
        console.log('2. Try the sign-up form');
        console.log('3. Check browser console for errors');
        
    } catch (error) {
        console.log('\n❌ Test failed:', error.message);
        console.log('\nPossible issues:');
        console.log('- User Pool configuration');
        console.log('- Client ID permissions');
        console.log('- Network connectivity');
        console.log('- Sign-up disabled on User Pool');
    }
}

main();