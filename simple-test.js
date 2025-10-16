exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Hello from Lambda!',
            path: event.path,
            httpMethod: event.httpMethod,
            headers: event.headers
        })
    };
};