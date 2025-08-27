// Mock for MCP SDK Server

class Server {
  constructor(serverInfo, capabilities) {
    this.serverInfo = serverInfo;
    this.capabilities = capabilities;
    this.requestHandlers = new Map();
    this.onerror = null;
  }

  setRequestHandler(schema, handler) {
    this.requestHandlers.set(schema.method || schema.name || 'unknown', handler);
  }

  async connect(transport) {
    // Mock connection
    return Promise.resolve();
  }

  async close() {
    // Mock close
    return Promise.resolve();
  }
}

module.exports = { Server };