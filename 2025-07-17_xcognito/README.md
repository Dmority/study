# Todo Management Application

A serverless todo management application built with AWS services including CloudFront, S3, Cognito, API Gateway, Lambda, and DynamoDB.

## Architecture

```
[User] → [CloudFront] → [S3 Static Website] → [Cognito User Pool] → [API Gateway] → [Lambda Functions] → [DynamoDB]
```

## Features

- **User Authentication**: Secure signup/signin with AWS Cognito
- **Todo Management**: Create, read, update, delete todo items
- **Responsive Design**: Works on desktop and mobile devices
- **Serverless**: Auto-scaling, pay-per-use AWS infrastructure
- **Global CDN**: Fast content delivery via CloudFront

## Prerequisites

- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed
- Node.js 20.x LTS or later
- npm or yarn package manager

## Project Structure

```
├── frontend/           # Frontend application
│   ├── src/
│   │   ├── js/        # JavaScript modules
│   │   ├── css/       # Stylesheets
│   │   └── assets/    # Static assets
│   ├── public/        # Public HTML files
│   └── package.json
├── backend/           # Lambda functions
│   ├── src/
│   │   ├── functions/ # Lambda function code
│   │   └── utils/     # Utility functions
│   ├── tests/         # Unit tests
│   └── package.json
├── infrastructure/    # AWS infrastructure
│   ├── template.yaml  # SAM template
│   └── scripts/       # Deployment scripts
├── requirements.md    # Project requirements
├── design.md         # Architecture and design
└── todo.md           # Development tasks
```

## Getting Started

### 1. Clone and Setup

```bash
git clone <repository-url>
cd 2025-07-17_xcognito
```

### 2. Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

### 3. Local Development

```bash
# Start local API with SAM
sam local start-api

# Start frontend development server
cd frontend
npm run dev
```

### 4. Deploy to AWS

```bash
# Build and deploy
sam build
sam deploy --guided
```

## API Endpoints

- `GET /todos` - Get all todos for authenticated user
- `POST /todos` - Create new todo
- `PUT /todos/{id}` - Update todo
- `DELETE /todos/{id}` - Delete todo

## Environment Variables

Required environment variables are managed through the SAM template:

- `TODOS_TABLE` - DynamoDB table name
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_CLIENT_ID` - Cognito Client ID

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests (when implemented)
cd frontend
npm test
```

## Deployment

The application uses AWS SAM for infrastructure as code. Deploy with:

```bash
sam build
sam deploy --parameter-overrides Stage=prod
```

## Security

- All API endpoints require authentication
- Users can only access their own todos
- HTTPS enforced for all communications
- Input validation on client and server side

## Cost Optimization

- Uses AWS Free Tier resources where possible
- DynamoDB on-demand billing
- Lambda pay-per-invocation
- S3 and CloudFront optimized for static assets

## Contributing

1. Follow the todo.md checklist for development tasks
2. Write tests for new features
3. Update documentation as needed
4. Use ESLint for code quality

## License

MIT License