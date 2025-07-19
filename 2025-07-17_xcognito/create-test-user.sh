#!/bin/bash

# Script to create a test user in the Todo Cognito User Pool
# Make sure your AWS credentials are valid before running this

USER_POOL_ID="us-east-1_yNgvsE3q1"
USERNAME="testuser"
EMAIL="test@example.com"
TEMP_PASSWORD="TempPassword123!"
REGION="us-east-1"
PROFILE="030878370429_AWSAdministratorAccess"

echo "Creating test user in Cognito User Pool..."
echo "User Pool ID: $USER_POOL_ID"
echo "Username: $USERNAME"
echo "Email: $EMAIL"
echo "Temporary Password: $TEMP_PASSWORD"
echo ""

# Create the user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --user-attributes Name=email,Value=$EMAIL Name=email_verified,Value=true \
  --temporary-password $TEMP_PASSWORD \
  --message-action SUPPRESS \
  --region $REGION \
  --profile $PROFILE

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test user created successfully!"
    echo ""
    echo "📋 Login Credentials:"
    echo "Username: $USERNAME"
    echo "Email: $EMAIL"
    echo "Temporary Password: $TEMP_PASSWORD"
    echo ""
    echo "🔄 Next Steps:"
    echo "1. Go to: http://localhost:8080/public/index.html"
    echo "2. Login with the credentials above"
    echo "3. You'll be prompted to set a new password"
    echo "4. After setting new password, you'll be logged in"
    echo ""
    echo "🎯 Then you can test:"
    echo "- Todo creation functionality"
    echo "- Emote backend integration"
    echo "- Debug pages: http://localhost:8080/public/debug-emote.html"
else
    echo ""
    echo "❌ Failed to create test user"
    echo ""
    echo "🔧 Manual Alternative:"
    echo "1. Go to AWS Console > Cognito > User Pools"
    echo "2. Find user pool: us-east-1_yNgvsE3q1"
    echo "3. Click 'Create user'"
    echo "4. Set:"
    echo "   - Username: testuser"
    echo "   - Email: test@example.com"
    echo "   - Temporary password: TempPassword123!"
    echo "   - Email verified: true"
    echo "5. Uncheck 'Send invitation'"
fi

echo ""
echo "🌐 Frontend URL: http://localhost:8080/public/index.html"
echo "🔧 Debug URL: http://localhost:8080/public/debug-emote.html"