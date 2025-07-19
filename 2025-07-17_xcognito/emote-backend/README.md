# Emote Backend

A serverless backend service that generates random emotions. This service is completely independent from the todo backend and includes its own authentication system.

## Architecture

- **AWS Cognito**: User authentication and JWT token management
- **AWS API Gateway**: REST API endpoints with throttling and CORS
- **AWS Lambda**: Emotion generation logic
- **AWS CloudFormation**: Infrastructure as Code

## API Endpoints

### GET /emotion
Returns a single random emotion.

**Authentication**: Required (Cognito JWT token)

**Response**:
```json
{
  "success": true,
  "data": {
    "emotion": "Good",
    "userId": "user-id-from-cognito"
  },
  "timestamp": "2025-07-17T10:30:00Z"
}
```

### GET /emotions
Returns a list of all available emotions.

**Authentication**: Required (Cognito JWT token)

**Response**:
```json
{
  "success": true,
  "data": {
    "emotions": ["Good", "Happy", "Excited", "Calm", "Energetic", "Peaceful", "Joyful", "Optimistic"],
    "count": 20
  },
  "timestamp": "2025-07-17T10:30:00Z"
}
```

## Available Emotions

The service includes 20 predefined emotions:
- Good, Happy, Excited, Calm, Energetic
- Peaceful, Joyful, Optimistic, Relaxed, Confident
- Motivated, Cheerful, Content, Inspired, Focused
- Grateful, Hopeful, Balanced, Refreshed, Positive

## Deployment

### Prerequisites
- AWS CLI installed and configured
- SAM CLI installed
- Node.js 18.x or later

### Deploy to AWS
```bash
cd infrastructure
./deploy.sh
```

### Deploy to specific environment
```bash
cd infrastructure
./deploy.sh --environment staging --region us-west-2
```

### Deploy options
- `-e, --environment`: Environment (dev, staging, prod) [default: dev]
- `-r, --region`: AWS region [default: us-east-1]
- `-s, --stack-name`: CloudFormation stack name [default: emote-backend]
- `-h, --help`: Show help message

## Development

### Local Testing
```bash
cd src/functions
npm install
npm test
```

### Lambda Function Structure
- `emote.js`: Main Lambda handler
- `package.json`: Dependencies and scripts

## Configuration

After deployment, configuration details are saved to `config.json`:
```json
{
  "environment": "dev",
  "region": "us-east-1",
  "stackName": "emote-backend-dev",
  "apiUrl": "https://api-id.execute-api.us-east-1.amazonaws.com/dev",
  "userPoolId": "us-east-1_XXXXXXXXX",
  "userPoolClientId": "xxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Security

- JWT token validation on all endpoints
- CORS enabled for web frontend access
- Rate limiting (100 requests/second, 200 burst)
- Separate Cognito User Pool from other services

## Testing

### Test Authentication
1. Create a user in the Cognito User Pool
2. Get JWT token using Cognito authentication
3. Use token in Authorization header for API calls

### Test Endpoints
```bash
# Get random emotion
curl -H "Authorization: Bearer <jwt-token>" \
  https://api-url/dev/emotion

# Get all emotions
curl -H "Authorization: Bearer <jwt-token>" \
  https://api-url/dev/emotions
```

## Cleanup

To delete the entire stack:
```bash
aws cloudformation delete-stack --stack-name emote-backend-dev --region us-east-1
```