/**
 * AWS Development Workflow Enhancer Tests
 * 
 * Tests for the AWS development workflow enhancement component
 */

import { AWSWorkflowEnhancer } from '../../components/aws-development-workflow-enhancer';

describe('AWSWorkflowEnhancer', () => {
  let enhancer: AWSWorkflowEnhancer;

  beforeEach(() => {
    enhancer = new AWSWorkflowEnhancer({
      defaultLanguage: 'typescript',
      defaultSDKVersion: 'v3',
      enableCaching: false, // Disable caching for tests
    });
  });

  afterEach(() => {
    if (enhancer) {
      enhancer.clearCache();
    }
  });

  describe('initialization', () => {
    it('should initialize with default configuration', async () => {
      expect(enhancer).toBeDefined();
      
      // Wait for initialization to complete
      if (!enhancer.isReady()) {
        await new Promise((resolve) => {
          enhancer.once('initialized', resolve);
        });
      }
      
      expect(enhancer.isReady()).toBe(true);
    });

    it('should initialize with custom configuration', () => {
      const customEnhancer = new AWSWorkflowEnhancer({
        defaultLanguage: 'python',
        defaultSDKVersion: 'v2',
        maxBestPractices: 5,
      });

      expect(customEnhancer).toBeDefined();
    });
  });

  describe('service extraction', () => {
    it('should extract AWS service names from query text', () => {
      const enhancerInstance = enhancer as any;
      
      const services1 = enhancerInstance.extractServicesFromQuery('How to use lambda functions with s3?');
      expect(services1).toContain('lambda');
      expect(services1).toContain('s3');

      const services2 = enhancerInstance.extractServicesFromQuery('dynamodb table operations');
      expect(services2).toContain('dynamodb');

      const services3 = enhancerInstance.extractServicesFromQuery('api-gateway integration');
      expect(services3).toContain('api-gateway');
    });

    it('should extract operation names from query text', () => {
      const enhancerInstance = enhancer as any;
      
      const operations1 = enhancerInstance.extractOperationsFromQuery('How to create and delete S3 buckets?');
      expect(operations1).toContain('create');
      expect(operations1).toContain('delete');

      const operations2 = enhancerInstance.extractOperationsFromQuery('lambda function invoke');
      expect(operations2).toContain('invoke');

      const operations3 = enhancerInstance.extractOperationsFromQuery('get and put dynamodb items');
      expect(operations3).toContain('get');
      expect(operations3).toContain('put');
    });
  });

  describe('utility methods', () => {
    it('should convert strings to kebab-case', () => {
      const enhancerInstance = enhancer as any;
      
      expect(enhancerInstance.kebabCase('createBucket')).toBe('create-bucket');
      expect(enhancerInstance.kebabCase('getObject')).toBe('get-object');
      expect(enhancerInstance.kebabCase('listObjects')).toBe('list-objects');
    });

    it('should generate client names correctly', () => {
      const enhancerInstance = enhancer as any;
      
      expect(enhancerInstance.getClientName('s3')).toBe('S3Client');
      expect(enhancerInstance.getClientName('lambda')).toBe('LambdaClient');
      expect(enhancerInstance.getClientName('dynamodb')).toBe('DynamodbClient');
    });

    it('should generate command names correctly', () => {
      const enhancerInstance = enhancer as any;
      
      expect(enhancerInstance.getCommandName('putObject')).toBe('PutObjectCommand');
      expect(enhancerInstance.getCommandName('invoke')).toBe('InvokeCommand');
      expect(enhancerInstance.getCommandName('getItem')).toBe('GetItemCommand');
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', () => {
      expect(() => enhancer.clearCache()).not.toThrow();
    });
  });

  describe('pricing models', () => {
    it('should return appropriate pricing models for known services', () => {
      const enhancerInstance = enhancer as any;
      
      expect(enhancerInstance.getPricingModel('lambda')).toContain('Pay per request');
      expect(enhancerInstance.getPricingModel('s3')).toContain('Pay for storage');
      expect(enhancerInstance.getPricingModel('ec2')).toContain('Pay for compute');
      expect(enhancerInstance.getPricingModel('unknown-service')).toContain('Varies by usage');
    });
  });

  describe('service limits', () => {
    it('should return service limits for known services', () => {
      const enhancerInstance = enhancer as any;
      
      const lambdaLimits = enhancerInstance.getServiceLimits('lambda');
      expect(lambdaLimits).toBeInstanceOf(Array);
      expect(lambdaLimits.length).toBeGreaterThan(0);
      expect(lambdaLimits[0]).toHaveProperty('name');
      expect(lambdaLimits[0]).toHaveProperty('defaultValue');
      expect(lambdaLimits[0]).toHaveProperty('adjustable');

      const s3Limits = enhancerInstance.getServiceLimits('s3');
      expect(s3Limits).toBeInstanceOf(Array);

      const unknownLimits = enhancerInstance.getServiceLimits('unknown-service');
      expect(unknownLimits).toEqual([]);
    });
  });

  describe('best practices', () => {
    it('should generate security recommendations', () => {
      const enhancerInstance = enhancer as any;
      const context = {
        services: ['lambda', 's3'],
        stage: 'production' as const,
        applicationType: 'web' as const,
      };

      const recommendations = enhancerInstance.getSecurityRecommendations(context);
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('category', 'security');
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('description');
      expect(recommendations[0]).toHaveProperty('implementation');
      expect(recommendations[0]).toHaveProperty('priority');
    });

    it('should generate performance recommendations', () => {
      const enhancerInstance = enhancer as any;
      const context = {
        services: ['lambda', 's3'],
        stage: 'production' as const,
        applicationType: 'web' as const,
      };

      const recommendations = enhancerInstance.getPerformanceRecommendations(context);
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('category', 'performance');
    });

    it('should generate cost recommendations', () => {
      const enhancerInstance = enhancer as any;
      const context = {
        services: ['lambda', 's3'],
        stage: 'production' as const,
        applicationType: 'web' as const,
      };

      const recommendations = enhancerInstance.getCostRecommendations(context);
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('category', 'cost');
    });
  });

  describe('code generation', () => {
    it('should get correct dependencies for different languages', () => {
      const enhancerInstance = enhancer as any;
      
      const tsDeps = enhancerInstance.getDependencies('s3', { language: 'typescript', sdkVersion: 'v3' });
      expect(tsDeps).toContain('@aws-sdk/client-s3');

      const jsDeps = enhancerInstance.getDependencies('s3', { language: 'javascript', sdkVersion: 'v2' });
      expect(jsDeps).toContain('aws-sdk');

      const pythonDeps = enhancerInstance.getDependencies('s3', { language: 'python' });
      expect(pythonDeps).toContain('boto3');

      const javaDeps = enhancerInstance.getDependencies('s3', { language: 'java' });
      expect(javaDeps).toContain('software.amazon.awssdk:s3');
    });

    it('should generate best practices for services', () => {
      const enhancerInstance = enhancer as any;
      
      const lambdaPractices = enhancerInstance.getCodeBestPractices('lambda', 'invoke');
      expect(lambdaPractices).toBeInstanceOf(Array);
      expect(lambdaPractices.length).toBeGreaterThan(0);
      expect(lambdaPractices.some((practice: string) => practice.includes('error'))).toBe(true);

      const s3Practices = enhancerInstance.getCodeBestPractices('s3', 'putObject');
      expect(s3Practices).toBeInstanceOf(Array);
      expect(s3Practices.length).toBeGreaterThan(0);
    });

    it('should generate common pitfalls for services', () => {
      const enhancerInstance = enhancer as any;
      
      const lambdaPitfalls = enhancerInstance.getCommonPitfalls('lambda', 'invoke');
      expect(lambdaPitfalls).toBeInstanceOf(Array);
      expect(lambdaPitfalls.length).toBeGreaterThan(0);
      expect(lambdaPitfalls.some((pitfall: string) => pitfall.includes('cold start'))).toBe(true);

      const s3Pitfalls = enhancerInstance.getCommonPitfalls('s3', 'putObject');
      expect(s3Pitfalls).toBeInstanceOf(Array);
      expect(s3Pitfalls.length).toBeGreaterThan(0);
    });
  });
});