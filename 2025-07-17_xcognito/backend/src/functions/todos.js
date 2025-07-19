const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TODOS_TABLE;

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const { httpMethod, pathParameters, body } = event;
    
    // Handle CORS preflight requests
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    const userId = event.requestContext.authorizer.claims.sub;
    
    try {
        switch (httpMethod) {
            case 'GET':
                return await getTodos(userId);
            case 'POST':
                return await createTodo(userId, JSON.parse(body));
            case 'PUT':
                return await updateTodo(userId, pathParameters.id, JSON.parse(body));
            case 'DELETE':
                return await deleteTodo(userId, pathParameters.id);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function getTodos(userId) {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        }
    };
    
    const result = await ddbDocClient.send(new QueryCommand(params));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            data: result.Items || []
        })
    };
}

async function createTodo(userId, todoData) {
    const todoId = uuidv4();
    const now = new Date().toISOString();
    
    const todo = {
        userId,
        todoId,
        title: todoData.title,
        description: todoData.description || '',
        completed: false,
        createdAt: now,
        updatedAt: now,
        ...(todoData.dueDate && { dueDate: todoData.dueDate })
    };
    
    const params = {
        TableName: TABLE_NAME,
        Item: todo
    };
    
    await ddbDocClient.send(new PutCommand(params));
    
    return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
            success: true,
            data: todo
        })
    };
}

async function updateTodo(userId, todoId, updates) {
    const now = new Date().toISOString();
    
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    if (updates.title !== undefined) {
        updateExpression.push('#title = :title');
        expressionAttributeNames['#title'] = 'title';
        expressionAttributeValues[':title'] = updates.title;
    }
    
    if (updates.description !== undefined) {
        updateExpression.push('#description = :description');
        expressionAttributeNames['#description'] = 'description';
        expressionAttributeValues[':description'] = updates.description;
    }
    
    if (updates.completed !== undefined) {
        updateExpression.push('#completed = :completed');
        expressionAttributeNames['#completed'] = 'completed';
        expressionAttributeValues[':completed'] = updates.completed;
    }
    
    if (updates.dueDate !== undefined) {
        updateExpression.push('#dueDate = :dueDate');
        expressionAttributeNames['#dueDate'] = 'dueDate';
        expressionAttributeValues[':dueDate'] = updates.dueDate;
    }
    
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;
    
    const params = {
        TableName: TABLE_NAME,
        Key: { userId, todoId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
    };
    
    const result = await ddbDocClient.send(new UpdateCommand(params));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            data: result.Attributes
        })
    };
}

async function deleteTodo(userId, todoId) {
    const params = {
        TableName: TABLE_NAME,
        Key: { userId, todoId }
    };
    
    await ddbDocClient.send(new DeleteCommand(params));
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            message: 'Todo deleted successfully'
        })
    };
}