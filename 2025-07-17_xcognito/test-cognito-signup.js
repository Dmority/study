const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    region: 'us-east-1'
});

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

async function testSignup() {
    const params = {
        ClientId: '125i53k4ken5kkd3bs0bg66en3',
        Username: 'test-user-' + Date.now() + '@example.com',
        Password: 'TestPassword123!',
        UserAttributes: [
            {
                Name: 'email',
                Value: 'test-user-' + Date.now() + '@example.com'
            }
        ]
    };

    try {
        const result = await cognitoIdentityServiceProvider.signUp(params).promise();
        console.log('Signup successful:', result);
        
        // Clean up - delete the test user
        const deleteParams = {
            UserPoolId: 'us-east-1_3qvjUY9s4',
            Username: result.UserSub
        };
        await cognitoIdentityServiceProvider.adminDeleteUser(deleteParams).promise();
        console.log('Test user cleaned up');
        
    } catch (error) {
        console.error('Signup failed:', error);
    }
}

testSignup();