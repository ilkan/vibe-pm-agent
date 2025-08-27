// Mock for MCP SDK types

const CallToolRequestSchema = {
  method: 'tools/call',
  name: 'CallToolRequest'
};

const ListToolsRequestSchema = {
  method: 'tools/list',
  name: 'ListToolsRequest'
};

const ErrorCode = {
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603
};

class McpError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = 'McpError';
  }
}

module.exports = {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
};