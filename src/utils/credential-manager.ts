/**
 * Credential Manager Utility
 * 
 * Handles loading and managing AWS credentials and API keys for NVIDIA NIM integration.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Credential Interfaces
// ============================================================================

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  sessionToken?: string;
  nim_api_key?: string;
}

export interface CredentialConfig {
  profile?: string;
  region?: string;
  timeout?: number;
}

// ============================================================================
// Credential Loading Functions
// ============================================================================

/**
 * Load AWS credentials from specified file path
 */
export async function loadAWSCredentials(
  credentialsPath: string,
  config: CredentialConfig = {}
): Promise<AWSCredentials> {
  try {
    const { profile = 'default', timeout = 5000 } = config;
    
    // Resolve the credentials file path
    const resolvedPath = path.resolve(credentialsPath);
    
    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      throw new Error(`Credentials file not found: ${resolvedPath}`);
    }

    // Read credentials file
    const credentialsContent = await fs.readFile(resolvedPath, 'utf-8');
    
    // Parse credentials based on file format
    if (resolvedPath.endsWith('.json')) {
      return parseJSONCredentials(credentialsContent, profile);
    } else {
      return parseINICredentials(credentialsContent, profile);
    }
  } catch (error) {
    throw new Error(`Failed to load AWS credentials: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse JSON format credentials
 */
function parseJSONCredentials(content: string, profile: string): AWSCredentials {
  try {
    const credentials = JSON.parse(content);
    
    if (credentials[profile]) {
      return credentials[profile];
    } else if (profile === 'default' && credentials.accessKeyId) {
      // Direct format without profile
      return credentials;
    } else {
      throw new Error(`Profile '${profile}' not found in credentials`);
    }
  } catch (error) {
    throw new Error(`Invalid JSON credentials format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse INI format credentials (AWS standard format)
 */
function parseINICredentials(content: string, profile: string): AWSCredentials {
  try {
    const lines = content.split('\n');
    const credentials: Partial<AWSCredentials> = {};
    let currentProfile = '';
    let inTargetProfile = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith(';')) {
        continue;
      }

      // Check for profile section
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentProfile = trimmedLine.slice(1, -1).trim();
        inTargetProfile = currentProfile === profile;
        continue;
      }

      // Parse key-value pairs
      if (inTargetProfile && trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        const cleanKey = key.trim().toLowerCase();

        switch (cleanKey) {
          case 'aws_access_key_id':
            credentials.accessKeyId = value;
            break;
          case 'aws_secret_access_key':
            credentials.secretAccessKey = value;
            break;
          case 'region':
            credentials.region = value;
            break;
          case 'aws_session_token':
            credentials.sessionToken = value;
            break;
          case 'nim_api_key':
            credentials.nim_api_key = value;
            break;
        }
      }
    }

    // Validate required fields
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error(`Missing required credentials for profile '${profile}'`);
    }

    return credentials as AWSCredentials;
  } catch (error) {
    throw new Error(`Invalid INI credentials format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load credentials from environment variables
 */
export function loadCredentialsFromEnvironment(): Partial<AWSCredentials> {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    nim_api_key: process.env.NIM_API_KEY
  };
}

/**
 * Merge credentials from multiple sources with precedence
 */
export function mergeCredentials(
  ...credentialSources: Partial<AWSCredentials>[]
): AWSCredentials {
  const merged: Partial<AWSCredentials> = {};

  // Merge in order of precedence (later sources override earlier ones)
  for (const source of credentialSources) {
    Object.assign(merged, source);
  }

  // Validate required fields
  if (!merged.accessKeyId || !merged.secretAccessKey) {
    throw new Error('Missing required AWS credentials: accessKeyId and secretAccessKey');
  }

  return merged as AWSCredentials;
}

/**
 * Validate credentials format and completeness
 */
export function validateCredentials(credentials: Partial<AWSCredentials>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!credentials.accessKeyId) {
    errors.push('Missing AWS Access Key ID');
  } else if (typeof credentials.accessKeyId !== 'string' || credentials.accessKeyId.length < 16) {
    errors.push('Invalid AWS Access Key ID format');
  }

  if (!credentials.secretAccessKey) {
    errors.push('Missing AWS Secret Access Key');
  } else if (typeof credentials.secretAccessKey !== 'string' || credentials.secretAccessKey.length < 40) {
    errors.push('Invalid AWS Secret Access Key format');
  }

  if (credentials.region && typeof credentials.region !== 'string') {
    errors.push('Invalid AWS region format');
  }

  if (credentials.sessionToken && typeof credentials.sessionToken !== 'string') {
    errors.push('Invalid AWS session token format');
  }

  if (credentials.nim_api_key && typeof credentials.nim_api_key !== 'string') {
    errors.push('Invalid NIM API key format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Secure credential storage utility
 */
export class SecureCredentialManager {
  private credentials: Map<string, AWSCredentials> = new Map();
  private encryptionKey?: string;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Store credentials securely
   */
  async storeCredentials(key: string, credentials: AWSCredentials): Promise<void> {
    // Validate credentials before storing
    const validation = validateCredentials(credentials);
    if (!validation.valid) {
      throw new Error(`Invalid credentials: ${validation.errors.join(', ')}`);
    }

    // In a real implementation, you would encrypt the credentials
    this.credentials.set(key, { ...credentials });
  }

  /**
   * Retrieve stored credentials
   */
  async getCredentials(key: string): Promise<AWSCredentials | undefined> {
    return this.credentials.get(key);
  }

  /**
   * Remove stored credentials
   */
  async removeCredentials(key: string): Promise<boolean> {
    return this.credentials.delete(key);
  }

  /**
   * List stored credential keys
   */
  getStoredKeys(): string[] {
    return Array.from(this.credentials.keys());
  }

  /**
   * Clear all stored credentials
   */
  clearAll(): void {
    this.credentials.clear();
  }

  /**
   * Rotate credentials (update existing with new values)
   */
  async rotateCredentials(key: string, newCredentials: AWSCredentials): Promise<void> {
    if (!this.credentials.has(key)) {
      throw new Error(`Credentials not found for key: ${key}`);
    }

    await this.storeCredentials(key, newCredentials);
  }
}

// ============================================================================
// Credential Loading Strategies
// ============================================================================

/**
 * Load credentials using AWS standard credential chain
 */
export async function loadCredentialsWithChain(
  credentialsPath?: string,
  profile?: string
): Promise<AWSCredentials> {
  const credentialSources: Partial<AWSCredentials>[] = [];

  // 1. Environment variables (highest precedence)
  const envCredentials = loadCredentialsFromEnvironment();
  if (envCredentials.accessKeyId && envCredentials.secretAccessKey) {
    credentialSources.push(envCredentials);
  }

  // 2. Credentials file
  if (credentialsPath) {
    try {
      const fileCredentials = await loadAWSCredentials(credentialsPath, { profile });
      credentialSources.push(fileCredentials);
    } catch (error) {
      console.warn(`Failed to load credentials from file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 3. Default AWS credentials locations
  const defaultPaths = [
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.aws', 'credentials'),
    path.join(process.cwd(), '.aws', 'credentials')
  ];

  for (const defaultPath of defaultPaths) {
    try {
      const defaultCredentials = await loadAWSCredentials(defaultPath, { profile });
      credentialSources.push(defaultCredentials);
      break; // Use first successful default path
    } catch (error) {
      // Continue to next path
    }
  }

  if (credentialSources.length === 0) {
    throw new Error('No valid AWS credentials found in environment or credential files');
  }

  return mergeCredentials(...credentialSources);
}

/**
 * Create a credential manager with automatic loading
 */
export async function createCredentialManager(
  credentialsPath?: string,
  profile?: string,
  encryptionKey?: string
): Promise<SecureCredentialManager> {
  const manager = new SecureCredentialManager(encryptionKey);

  try {
    const credentials = await loadCredentialsWithChain(credentialsPath, profile);
    await manager.storeCredentials('default', credentials);
  } catch (error) {
    console.warn(`Failed to load default credentials: ${error instanceof Error ? error.message : String(error)}`);
  }

  return manager;
}