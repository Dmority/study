# Design Document - Todo Management Application

## System Architecture

### High-Level Architecture
```
[User] → [CloudFront] → [S3 Static Website] → [Cognito User Pool] → [API Gateway] → [Lambda Functions] → [DynamoDB]
```

**Frontend Tier:**
- **CloudFront**: CDN for global content delivery and caching
- **S3**: Static website hosting for HTML, CSS, JS files

**Authentication Tier:**
- **Cognito User Pool**: User authentication and management
- **Cognito Identity Pool**: AWS credentials for authenticated users

**API Tier:**
- **API Gateway**: REST API endpoint management and routing
- **Lambda Authorizer**: JWT token validation

**Backend Tier:**
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB**: NoSQL database for todo data storage

### Components

**Frontend Components:**
- `Auth Service`: Handles Cognito authentication
- `API Client`: Manages API Gateway requests
- `Todo Manager`: CRUD operations for todos
- `UI Components`: Login, TodoList, TodoForm, TodoItem

**Backend Components:**
- `Auth Lambda`: User registration, login, token validation
- `Todo CRUD Lambda`: Create, Read, Update, Delete operations
- `DynamoDB Handler`: Database operations abstraction

### Data Flow

**Authentication Flow:**
1. User submits credentials → Cognito User Pool
2. Cognito returns JWT tokens → Frontend stores tokens
3. Frontend includes JWT in API requests → API Gateway
4. Lambda Authorizer validates JWT → Allows/denies access

**Todo Operations Flow:**
1. Frontend makes API request with JWT → API Gateway
2. API Gateway validates request → Routes to Lambda
3. Lambda processes business logic → Queries DynamoDB
4. DynamoDB returns data → Lambda formats response
5. Response sent back → Frontend updates UI

## Database Design

### DynamoDB Table Structure

**Todos Table:**
```
Table Name: todos
Partition Key: userId (String)
Sort Key: todoId (String)
```

**Attributes:**
- `userId`: Cognito user ID (PK)
- `todoId`: UUID for todo item (SK)
- `title`: Todo title (String)
- `description`: Todo description (String)
- `completed`: Completion status (Boolean)
- `createdAt`: ISO timestamp (String)
- `updatedAt`: ISO timestamp (String)
- `dueDate`: Due date (String, optional)

**Access Patterns:**
- Get all todos for user: Query by userId
- Get specific todo: Query by userId and todoId
- Create todo: Put item with new todoId
- Update todo: Update item by userId and todoId
- Delete todo: Delete item by userId and todoId

## API Design

### Endpoints

**Authentication Endpoints:**
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout
- `POST /auth/refresh` - Refresh JWT token

**Todo Management Endpoints:**
- `GET /todos` - Get all todos for authenticated user
- `POST /todos` - Create new todo
- `GET /todos/{id}` - Get specific todo
- `PUT /todos/{id}` - Update todo
- `DELETE /todos/{id}` - Delete todo

### Request/Response Models

**Todo Model:**
```json
{
  "todoId": "uuid",
  "title": "string",
  "description": "string",
  "completed": "boolean",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "dueDate": "ISO timestamp (optional)"
}
```

**API Responses:**
```json
{
  "success": "boolean",
  "data": "object or array",
  "message": "string",
  "error": "string (if error)"
}
```

## User Interface Design

### Page Structure
- **Login Page**: Authentication form
- **Dashboard**: Todo list with add/edit functionality
- **Todo Form**: Modal or page for creating/editing todos

### User Experience Flow
1. **Landing**: User visits app → Redirected to login if not authenticated
2. **Authentication**: Login/signup → Cognito validation → Dashboard
3. **Todo Management**: View todos → Add/edit/delete → Real-time updates
4. **Logout**: Clear tokens → Redirect to login

## Security Design

### Authentication
- **Cognito User Pool**: Secure user management with email verification
- **JWT Tokens**: Access and refresh tokens for API authentication
- **Token Storage**: Secure storage in browser (localStorage with expiration)

### Authorization
- **Lambda Authorizer**: Validates JWT tokens on every API request
- **Resource-based Access**: Users can only access their own todos
- **CORS Configuration**: Proper cross-origin resource sharing setup

### Data Protection
- **HTTPS Everywhere**: All communications encrypted in transit
- **Data Validation**: Input sanitization and validation
- **Error Handling**: No sensitive data in error responses

## Performance Design

### Optimization Strategies
- **CloudFront Caching**: Static assets cached globally
- **API Gateway Caching**: API responses cached for performance
- **Lambda Optimization**: Minimal cold starts, efficient code
- **DynamoDB**: On-demand scaling, efficient queries

### Caching Strategy
- **Static Assets**: Long-term caching (1 year) with versioning
- **API Responses**: Short-term caching (5 minutes) for GET requests
- **Database Queries**: Application-level caching for frequently accessed data

## Deployment Design

### Environment Setup
- **Development**: Local development with AWS SAM
- **Staging**: Pre-production environment for testing
- **Production**: Live environment with monitoring

### CI/CD Pipeline
1. **Code Commit**: Push to GitHub repository
2. **Build**: GitHub Actions builds and tests
3. **Deploy**: Automatic deployment to staging
4. **Manual Approval**: Production deployment gate
5. **Monitoring**: CloudWatch alerts and dashboards

## Technology Stack

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Vanilla JS or React (for learning)
- **Build Tools**: Webpack or Vite
- **Authentication**: AWS Cognito JavaScript SDK

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: AWS Lambda with AWS SDK v3
- **Database**: AWS DynamoDB
- **Authentication**: AWS Cognito

### Infrastructure
- **IaC**: AWS CloudFormation or CDK
- **Monitoring**: AWS CloudWatch
- **Logging**: AWS CloudWatch Logs
- **Deployment**: AWS SAM or CDK

### Development Tools
- **Version Control**: Git with GitHub
- **Testing**: Jest for unit tests
- **Linting**: ESLint for code quality
- **Local Development**: AWS SAM CLI

---

# Emote Backend Design

## Architecture Overview

The emote backend is a separate, independent system with its own AWS resources:

- **Cognito User Pool**: Dedicated authentication for emote service
- **API Gateway**: REST API endpoints for emotion requests  
- **Lambda Function**: Core logic for generating random emotions
- **No Database**: Simple stateless service returning random emotions

## Components Design

### 1. Cognito User Pool (emote-cognito)
- **Purpose**: Independent authentication system for emote service
- **Configuration**: 
  - Separate user pool from todo backend
  - Email/username authentication
  - JWT token generation
  - Password policies and MFA options
- **Users**: Can be different from todo backend users

### 2. API Gateway (emote-api)
- **Type**: REST API Gateway
- **Endpoints**:
  - `GET /emotion` - Returns random emotion
  - `GET /emotions` - Returns list of available emotions (optional)
- **Authentication**: Cognito User Pool authorizer
- **CORS**: Enabled for web frontend access
- **Throttling**: Rate limiting for API protection

### 3. Lambda Function (emote-lambda)
- **Runtime**: Python 3.9+ or Node.js
- **Function**: Generate random emotions
- **Logic**:
  - Predefined array of emotions ("Good", "Happy", "Excited", "Calm", "Energetic", etc.)
  - Random selection algorithm
  - JSON response formatting
- **Environment**: Stateless, no external dependencies needed

### 4. Integration Flow
```
User Request → API Gateway → Cognito Auth → Lambda → Random Emotion Response
```

## API Design

### Endpoint: `GET /emotion`
- **Authentication**: Required (Cognito JWT)
- **Response**: 
  ```json
  {
    "emotion": "Good",
    "timestamp": "2025-07-17T10:30:00Z"
  }
  ```

### Endpoint: `GET /emotions` (Optional)
- **Authentication**: Required (Cognito JWT)
- **Response**: List of all available emotions
  ```json
  {
    "emotions": ["Good", "Happy", "Excited", "Calm", "Energetic", "Peaceful", "Joyful", "Optimistic"]
  }
  ```

## Security & Separation
- Completely isolated from todo backend
- Own Cognito user pool
- Independent API Gateway
- Separate Lambda function
- No shared resources or dependencies

## Deployment Considerations
- Separate CloudFormation/CDK stack
- Independent CI/CD pipeline
- Own environment variables and configurations
- Isolated monitoring and logging