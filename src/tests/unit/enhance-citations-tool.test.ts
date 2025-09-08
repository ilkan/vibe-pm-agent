/**
 * Unit tests for enhance_citations MCP tool
 */

import { enhanceCitations, enhanceCitationsSchema } from '../../mcp/tools/enhance_citations';
import { MCPToolContext } from '../../models/mcp';
import { CitationService } from '../../components/citation-service';
import { CitationIntegration } from '../../utils/citation-integration';
import { AICitationDiscoveryEngine } from '../../components/ai-citation-discovery-engine';

// Mock dependencies
jest.mock('../../components/citation-service');
jest.mock('../../utils/citation-integration');
jest.mock('../../components/ai-citation-discovery-engine');

describe('enhance_citations MCP Tool', () => {
  let mockContext: MCPToolContext;
  let mockCitationIntegration: jest.Mocked<CitationIntegration>;
  let mockAIDiscoveryEngine: jest.Mocked<AICitationDiscoveryEngine>;

  beforeEach(() => {
    mockContext = {
      toolName: 'enhance_citations',
      sessionId: 'test-session',
      timestamp: Date.now(),
      requestId: 'test-request',
      traceId: 'test-trace',
    };

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockCitationIntegration = new CitationIntegration() as jest.Mocked<CitationIntegration>;
    mockAIDiscoveryEngine = new AICitationDiscoveryEngine() as jest.Mocked<AICitationDiscoveryEngine>;

    // Mock CitationIntegration
    mockCitationIntegration.integrateCitations = jest.fn().mockResolvedValue({
      citations: [
        {
          id: 'test-citation-1',
          title: 'Test Citation 1',
          url: 'https://example.com/test1',
          domain: 'example.com',
          published_at: '2024-01-01',
          source_type: 'industry_report',
          confidence: 'high',
          key_finding: 'Test finding 1',
          organization: 'Test Org',
        },
      ],
      bibliography: '## References\n\n[1] Test Citation 1. Test Org (2024).',
      citationContexts: [
        {
          citation_id: 'test-citation-1',
          used_in_section: 'Analysis',
          specific_claim: 'Test claim',
          context_relevance: 'supporting',
        },
      ],
      metrics: {
        total_citations: 1,
        unique_domains: 1,
        average_confidence: 3,
        source_type_distribution: { industry_report: 1 },
        recency_score: 85,
        diversity_score: 70,
        credibility_score: 90,
      },
      enhancedContent: 'Enhanced content with citations [1].\n\n## References\n\n[1] Test Citation 1. Test Org (2024).',
      qualityReport: {
        overallScore: 85,
        complianceStatus: 'compliant',
        strengthAreas: ['High-quality sources'],
        improvementAreas: [],
        qualityGaps: [],
        recommendations: [],
        metrics: {
          sourceCredibility: 90,
          evidenceDiversity: 70,
          recencyScore: 85,
          methodologyTransparency: 75,
          sampleSizeAdequacy: 80,
          accessibilityScore: 95,
          complianceScore: 100,
        },
        assessmentDate: new Date(),
        citationCount: 1,
      },
      confidenceScores: {
        overallConfidence: 85,
        claimConfidences: new Map(),
        weakestClaims: [],
        strongestClaims: [],
        recommendationReliability: 'high',
      },
      validationResults: [
        {
          citation: {
            id: 'test-citation-1',
            title: 'Test Citation 1',
            url: 'https://example.com/test1',
            domain: 'example.com',
            published_at: '2024-01-01',
            source_type: 'industry_report',
            confidence: 'high',
            key_finding: 'Test finding 1',
            organization: 'Test Org',
          },
          accessibilityStatus: {
            isAccessible: true,
            accessType: 'free',
            lastChecked: new Date(),
            alternativeAccess: [],
            cacheAvailable: true,
          },
          credibilityAssessment: {
            overallScore: 90,
            factors: {
              domainAuthority: 85,
              authorCredentials: 80,
              peerReviewStatus: 90,
              citationFrequency: 75,
              methodologyTransparency: 85,
            },
            riskFactors: [],
            confidenceLevel: 'high',
            assessmentDate: new Date(),
          },
          complianceStatus: {
            isCompliant: true,
            checkedStandards: ['business'],
            violations: [],
            recommendations: [],
            lastChecked: new Date(),
          },
          alternativeSources: [],
          validationTimestamp: new Date(),
        },
      ],
    });

    // Mock AICitationDiscoveryEngine
    mockAIDiscoveryEngine.analyzeCitationNeeds = jest.fn().mockResolvedValue([
      {
        claim: 'Test claim requiring citation',
        claimType: 'quantitative',
        evidenceStrength: 'strong',
        requiredSourceTypes: ['industry_report'],
        confidenceThreshold: 80,
        industryRelevance: ['technology'],
        priority: 'high',
        context: 'Test context',
        suggestedKeywords: ['test', 'citation'],
      },
    ]);

    mockAIDiscoveryEngine.identifyUnsupportedClaims = jest.fn().mockResolvedValue([
      {
        claim: 'Unsupported test claim',
        claimType: 'qualitative',
        severity: 'medium',
        context: 'Test context',
        suggestedEvidence: ['Industry report'],
        riskLevel: 60,
      },
    ]);

    mockAIDiscoveryEngine.discoverRelevantSources = jest.fn().mockResolvedValue([
      {
        source: {
          id: 'additional-source-1',
          title: 'Additional Source 1',
          url: 'https://example.com/additional1',
          domain: 'example.com',
          published_at: '2024-02-01',
          source_type: 'consulting_study',
          confidence: 'high',
          key_finding: 'Additional finding',
          organization: 'Consulting Firm',
        },
        relevanceScore: 85,
        confidenceContribution: 80,
        evidenceStrength: 'strong',
        supportedClaims: ['Test claim'],
        matchingKeywords: ['test'],
        contextAlignment: 75,
      },
    ]);

    // Mock constructors
    (CitationIntegration as jest.MockedClass<typeof CitationIntegration>).mockImplementation(() => mockCitationIntegration);
    (AICitationDiscoveryEngine as jest.MockedClass<typeof AICitationDiscoveryEngine>).mockImplementation(() => mockAIDiscoveryEngine);
  });

  describe('Input Validation', () => {
    it('should validate required document_content parameter', async () => {
      const args = {
        document_type: 'business_case' as const,
      };

      const result = await enhanceCitations(args as any, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json?.message).toContain('document_content is required');
    });

    it('should validate non-empty document_content', async () => {
      const args = {
        document_content: '',
        document_type: 'business_case' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json?.message).toContain('document_content is required');
    });

    it('should validate required document_type parameter', async () => {
      const args = {
        document_content: 'Test content',
      };

      const result = await enhanceCitations(args as any, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json?.message).toContain('document_type is required');
    });

    it('should accept valid document types', async () => {
      const validTypes = ['business_case', 'market_analysis', 'executive_onepager', 'pr_faq', 'competitive_analysis'];
      
      for (const docType of validTypes) {
        const args = {
          document_content: 'Test content with claims that need citations.',
          document_type: docType as any,
        };

        const result = await enhanceCitations(args, mockContext);
        expect(result.isError).toBeFalsy();
      }
    });
  });

  describe('Citation Enhancement', () => {
    it('should enhance document with basic citation integration', async () => {
      const args = {
        document_content: 'This document contains claims that need citations.',
        document_type: 'business_case' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('Enhanced content with citations');
      expect(result.content[0].markdown).toContain('## References');
      expect(result.metadata?.citations?.total_citations).toBe(1);
      expect(result.metadata?.citations?.quality_score).toBe(85);
    });

    it('should handle custom enhancement options', async () => {
      const args = {
        document_content: 'Document with specific enhancement requirements.',
        document_type: 'market_analysis' as const,
        enhancement_options: {
          minimum_confidence: 90,
          source_diversity_requirement: 80,
          recency_requirement_months: 12,
          industry_focus: 'technology',
          geographic_scope: 'US',
          identify_unsupported_claims: true,
          suggest_additional_sources: true,
          perform_quality_assessment: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(mockCitationIntegration.integrateCitations).toHaveBeenCalledWith(
        'market_analysis',
        args.document_content,
        expect.objectContaining({
          minimum_quality_score: 90,
          max_citation_age_months: 12,
          industry_focus: 'technology',
          geographic_scope: 'US',
        }),
        'technology'
      );
    });

    it('should handle custom citation options', async () => {
      const args = {
        document_content: 'Document requiring specific citation formatting.',
        document_type: 'executive_onepager' as const,
        citation_options: {
          citation_style: 'apa' as const,
          minimum_citations: 5,
          minimum_confidence: 'high' as const,
          include_bibliography: false,
          validate_sources: false,
          assess_quality: false,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(mockCitationIntegration.integrateCitations).toHaveBeenCalledWith(
        'executive_onepager',
        args.document_content,
        expect.objectContaining({
          citation_style: 'apa',
          minimum_citations: 5,
          minimum_confidence: 'high',
          include_bibliography: false,
          validate_sources: false,
          assess_quality: false,
        }),
        ''
      );
    });
  });

  describe('AI Citation Discovery', () => {
    it('should analyze citation needs when enabled', async () => {
      const args = {
        document_content: 'Document with claims requiring analysis.',
        document_type: 'competitive_analysis' as const,
        enhancement_options: {
          identify_unsupported_claims: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(mockAIDiscoveryEngine.analyzeCitationNeeds).toHaveBeenCalledWith(args.document_content);
      expect(mockAIDiscoveryEngine.identifyUnsupportedClaims).toHaveBeenCalledWith(args.document_content);
      expect(result.metadata?.enhancement?.citation_requirements_identified).toBe(1);
      expect(result.metadata?.enhancement?.unsupported_claims_found).toBe(1);
    });

    it('should discover additional sources when enabled', async () => {
      const args = {
        document_content: 'Document needing additional source suggestions.',
        document_type: 'business_case' as const,
        enhancement_options: {
          suggest_additional_sources: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(mockAIDiscoveryEngine.discoverRelevantSources).toHaveBeenCalled();
      expect(result.metadata?.enhancement?.additional_sources_suggested).toBe(1);
    });

    it('should handle AI discovery failures gracefully', async () => {
      mockAIDiscoveryEngine.analyzeCitationNeeds.mockRejectedValue(new Error('Discovery failed'));
      mockAIDiscoveryEngine.identifyUnsupportedClaims.mockRejectedValue(new Error('Analysis failed'));

      const args = {
        document_content: 'Document with discovery issues.',
        document_type: 'market_analysis' as const,
        enhancement_options: {
          identify_unsupported_claims: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.enhancement?.citation_requirements_identified).toBe(0);
      expect(result.metadata?.enhancement?.unsupported_claims_found).toBe(0);
    });
  });

  describe('Quality Assessment', () => {
    it('should include quality assessment when enabled', async () => {
      const args = {
        document_content: 'Document requiring quality assessment.',
        document_type: 'pr_faq' as const,
        enhancement_options: {
          perform_quality_assessment: true,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).toContain('Citation Enhancement Summary');
      expect(result.content[0].markdown).toContain('Enhancement Metrics');
      expect(result.content[0].markdown).toContain('Citation Quality Breakdown');
      expect(result.metadata?.citations?.compliance_status).toBe('compliant');
    });

    it('should skip quality assessment summary when disabled', async () => {
      const args = {
        document_content: 'Document without quality assessment.',
        document_type: 'business_case' as const,
        enhancement_options: {
          perform_quality_assessment: false,
        },
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('markdown');
      expect(result.content[0].markdown).not.toContain('Citation Enhancement Summary');
    });
  });

  describe('Response Metadata', () => {
    it('should include comprehensive citation metadata', async () => {
      const args = {
        document_content: 'Document for metadata testing.',
        document_type: 'market_analysis' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.citations).toEqual(
        expect.objectContaining({
          total_citations: 1,
          credibility_score: 90,
          recency_score: 85,
          diversity_score: 70,
          bibliography_included: true,
          quality_score: 85,
          overall_confidence: 85,
          compliance_status: 'compliant',
          validations_passed: 1,
          validations_failed: 0,
          broken_links: 0,
          alternative_sources_found: 1,
        })
      );
    });

    it('should include enhancement metadata', async () => {
      const args = {
        document_content: 'Document for enhancement metadata testing.',
        document_type: 'competitive_analysis' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.enhancement).toEqual(
        expect.objectContaining({
          citation_requirements_identified: 1,
          unsupported_claims_found: 1,
          critical_claims: 0,
          additional_sources_suggested: 1,
          quality_gaps_identified: 0,
          improvement_recommendations: 0,
        })
      );
      expect(result.metadata?.enhancement?.content_length_increase).toMatch(/\d+\.\d+%/);
    });

    it('should track execution metrics', async () => {
      const args = {
        document_content: 'Document for execution metrics.',
        document_type: 'executive_onepager' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBeFalsy();
      expect(result.metadata?.executionTime).toBeGreaterThan(0);
      expect(result.metadata?.quotaUsed).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle citation integration failures', async () => {
      mockCitationIntegration.integrateCitations.mockRejectedValue(new Error('Integration failed'));

      const args = {
        document_content: 'Document with integration issues.',
        document_type: 'business_case' as const,
      };

      const result = await enhanceCitations(args, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json?.message).toContain('Integration failed');
    });

    it('should handle invalid arguments gracefully', async () => {
      const args = {
        document_content: null,
        document_type: 'invalid_type',
      };

      const result = await enhanceCitations(args as any, mockContext);

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('json');
      expect(result.content[0].json?.message).toContain('Validation failed');
    });
  });

  describe('Schema Validation', () => {
    it('should have valid JSON schema', () => {
      expect(enhanceCitationsSchema).toBeDefined();
      expect(enhanceCitationsSchema.type).toBe('object');
      expect(enhanceCitationsSchema.properties).toBeDefined();
      expect(enhanceCitationsSchema.required).toEqual(['document_content', 'document_type']);
    });

    it('should define all expected properties', () => {
      const properties = enhanceCitationsSchema.properties;
      
      expect(properties.document_content).toBeDefined();
      expect(properties.document_type).toBeDefined();
      expect(properties.enhancement_options).toBeDefined();
      expect(properties.citation_options).toBeDefined();
    });

    it('should have proper constraints on document_content', () => {
      const docContentSchema = enhanceCitationsSchema.properties.document_content;
      
      expect(docContentSchema.type).toBe('string');
      expect(docContentSchema.minLength).toBe(50);
      expect(docContentSchema.maxLength).toBe(50000);
    });

    it('should have valid document_type enum', () => {
      const docTypeSchema = enhanceCitationsSchema.properties.document_type;
      
      expect(docTypeSchema.type).toBe('string');
      expect(docTypeSchema.enum).toEqual([
        'business_case',
        'market_analysis',
        'executive_onepager',
        'pr_faq',
        'competitive_analysis',
      ]);
    });
  });

  describe('Integration with Citation Components', () => {
    it('should properly initialize citation components', async () => {
      const args = {
        document_content: 'Test document for component integration.',
        document_type: 'business_case' as const,
      };

      await enhanceCitations(args, mockContext);

      expect(CitationIntegration).toHaveBeenCalled();
      expect(AICitationDiscoveryEngine).toHaveBeenCalled();
    });

    it('should pass correct parameters to citation integration', async () => {
      const args = {
        document_content: 'Test document content.',
        document_type: 'market_analysis' as const,
        enhancement_options: {
          industry_focus: 'healthcare',
        },
        citation_options: {
          minimum_citations: 4,
          citation_style: 'apa' as const,
        },
      };

      await enhanceCitations(args, mockContext);

      expect(mockCitationIntegration.integrateCitations).toHaveBeenCalledWith(
        'market_analysis',
        'Test document content.',
        expect.objectContaining({
          minimum_citations: 4,
          citation_style: 'apa',
          industry_focus: 'healthcare',
        }),
        'healthcare'
      );
    });
  });
});