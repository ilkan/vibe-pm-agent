/**
 * Performance tests for steering file operations
 * 
 * Tests large document processing, concurrent file operations, and memory usage
 * during steering file creation and management.
 */

import { SteeringService } from '../../components/steering-service';
import { SteeringFileManager } from '../../components/steering-file-manager';
import { SteeringFileGenerator } from '../../components/steering-file-generator';
import { DocumentReferenceLinker } from '../../components/document-reference-linker';
import { DocumentType, SteeringFile } from '../../models/steering';
import { SteeringFileOptions } from '../../models/mcp';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Steering File Performance Tests', () => {
  let steeringService: SteeringService;
  let steeringManager: SteeringFileManager;
  let testSteeringDir: string;

  beforeEach(async () => {
    testSteeringDir = path.join(process.cwd(), 'test-steering-perf');
    await fs.mkdir(testSteeringDir, { recursive: true });

    steeringService = new SteeringService({
      steeringDirectory: testSteeringDir,
      userPreferences: { autoCreate: true, showPreview: false }
    });

    steeringManager = new SteeringFileManager({
      steeringDirectory: testSteeringDir,
      createBackups: false, // Disable for performance testing
      validateContent: true
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(testSteeringDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Large Document Processing Performance', () => {
    it('should handle very large PM agent documents efficiently', async () => {
      // Generate a large requirements document
      const largeRequirements = generateLargeRequirementsDocument(1000); // 1000 requirements
      const startTime = Date.now();
      const initialMemory = process.memoryUsage();

      const result = await steeringService.createFromRequirements(largeRequirements, {
        create_steering_files: true,
        feature_name: 'large-document-test',
        inclusion_rule: 'fileMatch'
      });

      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      const processingTime = endTime - startTime;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(result.created).toBe(true);
      expect(processingTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Memory increase should be reasonable (< 100MB)

      // Verify the file was created and contains expected content
      const filename = result.results[0].filename;
      const content = await fs.readFile(path.join(testSteeringDir, filename), 'utf8');
      expect(content.length).toBeGreaterThan(largeRequirements.length);
      expect(content).toContain('Requirement 500'); // Spot check middle content

      console.log(`Large Document Performance:
        Document Size: ${(largeRequirements.length / 1024).toFixed(2)}KB
        Processing Time: ${processingTime}ms
        Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
        Output Size: ${(content.length / 1024).toFixed(2)}KB`);
    });

    it('should process multiple large documents concurrently', async () => {
      const documentCount = 5;
      const documentsPerType = 2;
      const startTime = Date.now();
      const initialMemory = process.memoryUsage();

      // Generate large documents of different types
      const documents = [];
      for (let i = 0; i < documentsPerType; i++) {
        documents.push({
          type: 'requirements',
          content: generateLargeRequirementsDocument(200),
          featureName: `concurrent-req-${i}`
        });
        documents.push({
          type: 'design',
          content: generateLargeDesignDocument(150),
          featureName: `concurrent-design-${i}`
        });
      }

      // Process all documents concurrently
      const promises = documents.map(async (doc, index) => {
        const methodName = `createFrom${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}`;
        return steeringService[methodName](doc.content, {
          create_steering_files: true,
          feature_name: doc.featureName,
          inclusion_rule: 'fileMatch'
        });
      });

      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      const totalProcessingTime = endTime - startTime;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // All documents should be processed successfully
      results.forEach((result, index) => {
        expect(result.created).toBe(true);
      });

      expect(totalProcessingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Memory increase should be reasonable

      // Verify all files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(documents.length);

      console.log(`Concurrent Processing Performance:
        Documents Processed: ${documents.length}
        Total Processing Time: ${totalProcessingTime}ms
        Average Time per Document: ${(totalProcessingTime / documents.length).toFixed(2)}ms
        Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
        Files Created: ${steeringFiles.length}`);
    });

    it('should handle documents with many cross-references efficiently', async () => {
      const featureCount = 20;
      const startTime = Date.now();

      // Create multiple features that will cross-reference each other
      const features = Array.from({ length: featureCount }, (_, i) => `feature-${i + 1}`);
      
      // Create requirements for each feature
      for (const feature of features) {
        const requirements = `
# Requirements for ${feature}

## Introduction
This feature integrates with other system components.

## Requirements
${features.filter(f => f !== feature).map((otherFeature, index) => `
### Requirement ${index + 1}
**User Story:** As a user, I want ${feature} to work with ${otherFeature}.
**Acceptance Criteria:**
1. WHEN ${feature} is used THEN it SHALL integrate with ${otherFeature}
2. WHEN ${otherFeature} changes THEN ${feature} SHALL adapt accordingly
`).join('\n')}
        `;

        await steeringService.createFromRequirements(requirements, {
          create_steering_files: true,
          feature_name: feature,
          inclusion_rule: 'fileMatch'
        });
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(60000); // Should complete within 60 seconds

      // Verify all files were created with cross-references
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(featureCount);

      // Sample check for cross-references
      const sampleFile = steeringFiles[0];
      const content = await fs.readFile(path.join(testSteeringDir, sampleFile), 'utf8');
      const references = content.match(/#\[\[file:[^\]]+\]\]/g) || [];
      expect(references.length).toBeGreaterThan(0);

      console.log(`Cross-Reference Performance:
        Features Created: ${featureCount}
        Processing Time: ${processingTime}ms
        Average Time per Feature: ${(processingTime / featureCount).toFixed(2)}ms
        Sample References Count: ${references.length}`);
    });
  });

  describe('File System Operation Performance', () => {
    it('should handle high-frequency file operations efficiently', async () => {
      const operationCount = 50;
      const startTime = Date.now();

      // Perform many file operations in sequence
      const operations = [];
      for (let i = 0; i < operationCount; i++) {
        const steeringFile: SteeringFile = {
          filename: `perf-test-${i}.md`,
          frontMatter: {
            inclusion: 'manual',
            generatedBy: 'performance-test',
            generatedAt: new Date().toISOString(),
            featureName: `perf-feature-${i}`,
            documentType: DocumentType.REQUIREMENTS
          },
          content: `# Performance Test ${i}\n\nThis is a performance test steering file.`,
          references: []
        };

        operations.push(steeringManager.saveSteeringFile(steeringFile));
      }

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(operationCount);

      console.log(`File Operation Performance:
        Operations: ${operationCount}
        Total Time: ${totalTime}ms
        Average Time per Operation: ${(totalTime / operationCount).toFixed(2)}ms
        Operations per Second: ${((operationCount / totalTime) * 1000).toFixed(2)}`);
    });

    it('should handle concurrent file operations without conflicts', async () => {
      const concurrentOperations = 20;
      const startTime = Date.now();

      // Create concurrent file operations
      const promises = Array.from({ length: concurrentOperations }, (_, i) => {
        const steeringFile: SteeringFile = {
          filename: `concurrent-${i}.md`,
          frontMatter: {
            inclusion: 'manual',
            generatedBy: 'concurrent-test',
            generatedAt: new Date().toISOString(),
            featureName: `concurrent-feature-${i}`,
            documentType: DocumentType.DESIGN
          },
          content: `# Concurrent Test ${i}\n\nConcurrent operation test file.`,
          references: []
        };

        return steeringManager.saveSteeringFile(steeringFile);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All operations should succeed without conflicts
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.filename).toBe(`concurrent-${index}.md`);
      });

      // Verify all files exist
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(concurrentOperations);

      console.log(`Concurrent Operation Performance:
        Concurrent Operations: ${concurrentOperations}
        Total Time: ${totalTime}ms
        Average Time: ${(totalTime / concurrentOperations).toFixed(2)}ms`);
    });

    it('should efficiently handle file updates and versioning', async () => {
      const updateCount = 30;
      const featureName = 'version-test';
      
      // Create initial file
      let currentContent = '# Initial Version\n\nInitial content.';
      await steeringService.createFromRequirements(currentContent, {
        create_steering_files: true,
        feature_name: featureName,
        inclusion_rule: 'manual'
      });

      const startTime = Date.now();

      // Perform multiple updates
      for (let i = 1; i <= updateCount; i++) {
        currentContent = `# Version ${i}\n\nUpdated content for version ${i}.`;
        
        await steeringService.createFromRequirements(currentContent, {
          create_steering_files: true,
          feature_name: featureName,
          inclusion_rule: 'manual',
          overwrite_existing: true
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds

      // Verify final version
      const steeringFiles = await fs.readdir(testSteeringDir);
      const versionFile = steeringFiles.find(f => f.includes(featureName));
      expect(versionFile).toBeDefined();

      const finalContent = await fs.readFile(path.join(testSteeringDir, versionFile!), 'utf8');
      expect(finalContent).toContain(`Version ${updateCount}`);

      console.log(`Update Performance:
        Updates: ${updateCount}
        Total Time: ${totalTime}ms
        Average Time per Update: ${(totalTime / updateCount).toFixed(2)}ms`);
    });
  });

  describe('Memory Usage and Garbage Collection', () => {
    it('should maintain reasonable memory usage during bulk operations', async () => {
      const bulkOperationCount = 100;
      const memorySnapshots = [];

      // Take initial memory snapshot
      if (global.gc) global.gc();
      memorySnapshots.push({
        operation: 0,
        memory: process.memoryUsage()
      });

      // Perform bulk operations with periodic memory monitoring
      for (let i = 1; i <= bulkOperationCount; i++) {
        const content = generateMediumRequirementsDocument(50);
        
        await steeringService.createFromRequirements(content, {
          create_steering_files: true,
          feature_name: `bulk-${i}`,
          inclusion_rule: 'manual'
        });

        // Take memory snapshot every 20 operations
        if (i % 20 === 0) {
          if (global.gc) global.gc();
          memorySnapshots.push({
            operation: i,
            memory: process.memoryUsage()
          });
        }
      }

      // Analyze memory growth
      const initialMemory = memorySnapshots[0].memory.heapUsed;
      const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory.heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthPerOperation = memoryGrowth / bulkOperationCount;

      expect(memoryGrowthPerOperation).toBeLessThan(1024 * 1024); // Less than 1MB per operation
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Total growth less than 100MB

      console.log(`Memory Usage Analysis:
        Operations: ${bulkOperationCount}
        Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
        Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
        Total Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB
        Growth per Operation: ${(memoryGrowthPerOperation / 1024).toFixed(2)}KB`);

      // Verify all files were created
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(bulkOperationCount);
    });

    it('should handle memory pressure gracefully', async () => {
      // Create very large documents to test memory pressure
      const largeDocumentCount = 10;
      const documentsPerBatch = 3;
      
      for (let batch = 0; batch < Math.ceil(largeDocumentCount / documentsPerBatch); batch++) {
        const batchPromises = [];
        
        for (let i = 0; i < documentsPerBatch && (batch * documentsPerBatch + i) < largeDocumentCount; i++) {
          const docIndex = batch * documentsPerBatch + i;
          const largeContent = generateLargeRequirementsDocument(500); // Very large document
          
          batchPromises.push(
            steeringService.createFromRequirements(largeContent, {
              create_steering_files: true,
              feature_name: `memory-pressure-${docIndex}`,
              inclusion_rule: 'manual'
            })
          );
        }

        const batchResults = await Promise.all(batchPromises);
        
        // All operations in batch should succeed
        batchResults.forEach(result => {
          expect(result.created).toBe(true);
        });

        // Force garbage collection between batches
        if (global.gc) {
          global.gc();
        }

        // Small delay to allow memory cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify all files were created despite memory pressure
      const steeringFiles = await fs.readdir(testSteeringDir);
      expect(steeringFiles.length).toBe(largeDocumentCount);

      console.log(`Memory Pressure Test:
        Large Documents Created: ${largeDocumentCount}
        Files Created: ${steeringFiles.length}
        Test Completed Successfully`);
    });
  });

  describe('Scalability Benchmarks', () => {
    it('should scale linearly with document count', async () => {
      const testSizes = [10, 25, 50];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const initialMemory = process.memoryUsage();

        // Create documents of specified size
        const promises = Array.from({ length: size }, (_, i) => {
          const content = generateMediumRequirementsDocument(20);
          return steeringService.createFromRequirements(content, {
            create_steering_files: true,
            feature_name: `scale-test-${size}-${i}`,
            inclusion_rule: 'manual'
          });
        });

        const batchResults = await Promise.all(promises);
        
        const endTime = Date.now();
        const finalMemory = process.memoryUsage();
        const processingTime = endTime - startTime;
        const memoryUsed = finalMemory.heapUsed - initialMemory.heapUsed;

        // All should succeed
        batchResults.forEach(result => {
          expect(result.created).toBe(true);
        });

        results.push({
          size,
          processingTime,
          memoryUsed,
          timePerDocument: processingTime / size,
          memoryPerDocument: memoryUsed / size
        });

        // Clean up for next test
        await fs.rm(testSteeringDir, { recursive: true, force: true });
        await fs.mkdir(testSteeringDir, { recursive: true });
        
        if (global.gc) global.gc();
      }

      // Analyze scalability
      console.log('Scalability Analysis:');
      results.forEach(result => {
        console.log(`  Size ${result.size}:
          Total Time: ${result.processingTime}ms
          Time per Document: ${result.timePerDocument.toFixed(2)}ms
          Memory Used: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB
          Memory per Document: ${(result.memoryPerDocument / 1024).toFixed(2)}KB`);
      });

      // Verify reasonable scalability (time per document shouldn't increase dramatically)
      const timePerDocVariation = Math.max(...results.map(r => r.timePerDocument)) / 
                                  Math.min(...results.map(r => r.timePerDocument));
      expect(timePerDocVariation).toBeLessThan(3); // Shouldn't vary by more than 3x
    });
  });
});

// Helper functions for generating test documents
function generateLargeRequirementsDocument(requirementCount: number): string {
  const requirements = [];
  
  for (let i = 1; i <= requirementCount; i++) {
    requirements.push(`
### Requirement ${i}

**User Story:** As a user, I want feature ${i} to work efficiently, so that I can accomplish task ${i} with minimal effort.

#### Acceptance Criteria
1. WHEN user performs action ${i} THEN system SHALL respond within 2 seconds
2. WHEN user provides input ${i} THEN system SHALL validate the input correctly
3. WHEN system processes request ${i} THEN it SHALL log the operation for audit purposes
4. IF error occurs during operation ${i} THEN system SHALL provide meaningful error message
5. WHEN operation ${i} completes THEN user SHALL receive confirmation notification
    `);
  }

  return `# Large Requirements Document

## Introduction
This is a large requirements document generated for performance testing with ${requirementCount} requirements.

## Business Goal
To test the performance and scalability of steering file generation with large documents containing many requirements and detailed acceptance criteria.

## Requirements
${requirements.join('\n')}

## Additional Considerations
- Performance requirements must be met under load
- System must handle concurrent operations efficiently
- Memory usage should remain reasonable during processing
- Error handling must be robust for all edge cases
`;
}

function generateLargeDesignDocument(sectionCount: number): string {
  const sections = [];
  
  for (let i = 1; i <= sectionCount; i++) {
    sections.push(`
## Component ${i}

### Overview
Component ${i} is responsible for handling specific functionality within the system architecture.

### Interface
\`\`\`typescript
interface Component${i} {
  initialize(): Promise<void>;
  process(input: Input${i}): Promise<Output${i}>;
  cleanup(): Promise<void>;
}
\`\`\`

### Implementation Details
- Uses modern design patterns for maintainability
- Implements caching for performance optimization
- Includes comprehensive error handling
- Supports horizontal scaling through stateless design

### Dependencies
- Depends on Component${Math.max(1, i - 1)} for input processing
- Integrates with Component${Math.min(sectionCount, i + 1)} for output handling
- Utilizes shared utilities for common operations
    `);
  }

  return `# Large Design Document

## Architecture Overview
This design document outlines a comprehensive system architecture with ${sectionCount} components.

## System Components
${sections.join('\n')}

## Integration Patterns
All components follow consistent integration patterns for seamless operation.

## Performance Considerations
The architecture is designed for high performance and scalability.
`;
}

function generateMediumRequirementsDocument(requirementCount: number): string {
  const requirements = [];
  
  for (let i = 1; i <= requirementCount; i++) {
    requirements.push(`
### Requirement ${i}
**User Story:** As a user, I want feature ${i}.
**Acceptance Criteria:**
1. WHEN action ${i} THEN result ${i}
    `);
  }

  return `# Medium Requirements Document

## Requirements
${requirements.join('\n')}
`;
}