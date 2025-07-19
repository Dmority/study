#!/usr/bin/env node

// Comprehensive test for sign-up and sign-in flow
const https = require('https');

const AWS_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yNgvsE3q1',
    userPoolClientId: '68ur269ci0dngnqdugat7tfqsn'
};

function makeRequest(target, payload) {
    const postData = JSON.stringify(payload);
    
    const options = {
        hostname: `cognito-idp.${AWS_CONFIG.region}.amazonaws.com`,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': target,
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
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}, Data: ${data}`));
                    }
                } else {
                    try {
                        const error = JSON.parse(data);
                        reject(new Error(`${error.__type}: ${error.message}`));
                    } catch (parseError) {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

async function testCompleteFlow() {
    console.log('🧪 Testing Complete Sign-Up to Sign-In Flow');
    console.log('============================================');
    
    // Use a specific test email
    const testEmail = 'yourname+test@example.com';
    const testPassword = 'TestPassword123!';
    
    console.log(`Test email: ${testEmail}`);
    console.log(`Test password: ${testPassword}`);
    console.log('');
    
    try {
        // Step 1: Try to sign up
        console.log('Step 1: Attempting sign-up...');
        try {
            const signUpResult = await makeRequest('AWSCognitoIdentityProviderService.SignUp', {
                ClientId: AWS_CONFIG.userPoolClientId,
                Username: testEmail,
                Password: testPassword,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: testEmail
                    }
                ]
            });
            
            console.log('✅ Sign-up successful!');
            console.log(`   User Sub: ${signUpResult.UserSub}`);
            console.log(`   User confirmed: ${signUpResult.UserConfirmed}`);
            
            if (!signUpResult.UserConfirmed) {
                console.log('📧 Email verification required');
                console.log('   NOTE: In real usage, user would receive email with verification code');
            }
            
        } catch (error) {
            if (error.message.includes('UsernameExistsException')) {
                console.log('⚠️  User already exists, checking if confirmed...');
                
                // Check if user is confirmed
                try {
                    const resendResult = await makeRequest('AWSCognitoIdentityProviderService.ResendConfirmationCode', {
                        ClientId: AWS_CONFIG.userPoolClientId,
                        Username: testEmail
                    });
                    console.log('📧 User exists but not confirmed - resend code sent');
                } catch (resendError) {
                    if (resendError.message.includes('InvalidParameterException')) {
                        console.log('✅ User already confirmed');
                    } else {
                        console.log(`❌ Error checking user status: ${resendError.message}`);
                    }
                }
            } else {
                console.log(`❌ Sign-up failed: ${error.message}`);
                throw error;
            }
        }
        
        // Step 2: Try to sign in
        console.log('\nStep 2: Attempting sign-in...');
        try {
            const signInResult = await makeRequest('AWSCognitoIdentityProviderService.InitiateAuth', {
                ClientId: AWS_CONFIG.userPoolClientId,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: testEmail,
                    PASSWORD: testPassword
                }
            });
            
            if (signInResult.ChallengeName) {
                console.log(`⚠️  Challenge required: ${signInResult.ChallengeName}`);
                
                if (signInResult.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
                    console.log('   First-time login requires new password');
                    
                    // Set permanent password
                    const newPasswordResult = await makeRequest('AWSCognitoIdentityProviderService.RespondToAuthChallenge', {
                        ClientId: AWS_CONFIG.userPoolClientId,
                        ChallengeName: 'NEW_PASSWORD_REQUIRED',
                        Session: signInResult.Session,
                        ChallengeResponses: {
                            USERNAME: testEmail,
                            NEW_PASSWORD: testPassword
                        }
                    });
                    
                    console.log('✅ New password set successfully');
                    console.log(`   Access Token: ${newPasswordResult.AuthenticationResult.AccessToken.substring(0, 50)}...`);
                }
            } else if (signInResult.AuthenticationResult) {
                console.log('✅ Sign-in successful!');
                console.log(`   Access Token: ${signInResult.AuthenticationResult.AccessToken.substring(0, 50)}...`);
                console.log(`   ID Token: ${signInResult.AuthenticationResult.IdToken.substring(0, 50)}...`);
            }
            
        } catch (signInError) {
            if (signInError.message.includes('UserNotConfirmedException')) {
                console.log('❌ User not confirmed - email verification required');
                console.log('   This is why you cannot sign in with this email');
                
                // For testing purposes, let's auto-confirm the user
                console.log('\nStep 3: Auto-confirming user for testing...');
                
                // Note: This requires AWS CLI with admin permissions
                const { spawn } = require('child_process');
                
                return new Promise((resolve, reject) => {
                    const process = spawn('aws', [
                        'cognito-idp', 'admin-confirm-sign-up',
                        '--user-pool-id', AWS_CONFIG.userPoolId,
                        '--username', testEmail,
                        '--region', AWS_CONFIG.region,
                        '--profile', '030878370429_AWSAdministratorAccess'
                    ]);
                    
                    let output = '';
                    let error = '';
                    
                    process.stdout.on('data', (data) => {
                        output += data.toString();
                    });
                    
                    process.stderr.on('data', (data) => {
                        error += data.toString();
                    });
                    
                    process.on('close', async (code) => {
                        if (code === 0) {
                            console.log('✅ User confirmed successfully');
                            
                            // Now try to sign in again
                            console.log('\nStep 4: Attempting sign-in after confirmation...');
                            try {
                                const finalSignInResult = await makeRequest('AWSCognitoIdentityProviderService.InitiateAuth', {
                                    ClientId: AWS_CONFIG.userPoolClientId,
                                    AuthFlow: 'USER_PASSWORD_AUTH',
                                    AuthParameters: {
                                        USERNAME: testEmail,
                                        PASSWORD: testPassword
                                    }
                                });
                                
                                if (finalSignInResult.AuthenticationResult) {
                                    console.log('✅ Final sign-in successful!');
                                    console.log(`   Access Token: ${finalSignInResult.AuthenticationResult.AccessToken.substring(0, 50)}...`);
                                    console.log('');
                                    console.log('🎉 COMPLETE FLOW VERIFIED!');
                                    console.log(`✅ You can now sign in with: ${testEmail}`);
                                    console.log(`✅ Password: ${testPassword}`);
                                    console.log('');
                                    console.log('Test this in the browser:');
                                    console.log('1. Go to http://localhost:8080/public/index.html');
                                    console.log('2. Click "Sign up" to see the form');
                                    console.log('3. Click "Sign in" and use the credentials above');
                                    resolve();
                                } else {
                                    console.log('❌ Final sign-in still has challenges');
                                    reject(new Error('Sign-in challenges not resolved'));
                                }
                            } catch (finalError) {
                                console.log(`❌ Final sign-in failed: ${finalError.message}`);
                                reject(finalError);
                            }
                        } else {
                            console.log(`❌ User confirmation failed: ${error}`);
                            reject(new Error(`Confirmation failed: ${error}`));
                        }
                    });
                });
                
            } else {
                console.log(`❌ Sign-in failed: ${signInError.message}`);
                throw signInError;
            }
        }
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        throw error;
    }
}

async function main() {
    console.log(`Configuration:`);
    console.log(`  Region: ${AWS_CONFIG.region}`);
    console.log(`  User Pool ID: ${AWS_CONFIG.userPoolId}`);
    console.log(`  Client ID: ${AWS_CONFIG.userPoolClientId}`);
    console.log('');
    
    try {
        await testCompleteFlow();
    } catch (error) {
        console.log('\n❌ Complete flow test failed');
        console.log(`Error: ${error.message}`);
        console.log('');
        console.log('This explains why you cannot sign in with the test email.');
        console.log('The issue is likely:');
        console.log('- User exists but is not email-verified');
        console.log('- User needs to complete email verification');
        console.log('- AWS credentials expired for admin operations');
    }
}

main();