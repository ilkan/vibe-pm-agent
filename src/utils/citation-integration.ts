// Citation integration utilities for MCP tools

import { CitationService } from '../components/citation-service';
import {
    Citation,
    CitationSearchCriteria,
    CitationContext,
    ReferenceCollection,
    CitationMetrics
} from '../models/citations';
import { CitationOptions } from '../models/mcp';

/**
 * Citation integration helper for MCP tools
 */
export class CitationIntegration {
    private citationService: CitationService;

    constructor() {
        this.citationService = new CitationService();
    }

    /**
     * Find and integrate citations for a specific document type and content
     */
    async integrateCitations(
        documentType: string,
        content: string,
        options: CitationOptions = {},
        industry?: string
    ): Promise<{
        citations: Citation[];
        bibliography: string;
        citationContexts: CitationContext[];
        metrics: CitationMetrics;
        enhancedContent: string;
    }> {
        // Set default options
        const citationOptions: Required<CitationOptions> = {
            include_citations: options.include_citations ?? true,
            minimum_citations: options.minimum_citations ?? 3,
            minimum_confidence: options.minimum_confidence ?? 'medium',
            industry_focus: options.industry_focus ?? industry ?? '',
            geographic_scope: options.geographic_scope ?? 'global',
            citation_style: options.citation_style ?? 'business',
            include_bibliography: options.include_bibliography ?? true,
            max_citation_age_months: options.max_citation_age_months ?? 24
        };

        if (!citationOptions.include_citations) {
            return {
                citations: [],
                bibliography: '',
                citationContexts: [],
                metrics: this.citationService.calculateCitationMetrics([]),
                enhancedContent: content
            };
        }

        // Extract keywords from content for citation search
        const keywords = this.extractKeywords(content, documentType);

        // Build search criteria
        const searchCriteria: CitationSearchCriteria = {
            keywords,
            industry: citationOptions.industry_focus || undefined,
            date_range: {
                start: new Date(Date.now() - citationOptions.max_citation_age_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
            },
            minimum_confidence: citationOptions.minimum_confidence as any,
            language: 'english'
        };

        // Find relevant citations
        const citations = await this.citationService.findRelevantCitations(searchCriteria);

        // Ensure minimum citation count
        const selectedCitations = citations.slice(0, Math.max(citationOptions.minimum_citations, citations.length));

        // Create citation contexts based on content analysis
        const citationContexts = this.createCitationContexts(content, selectedCitations, documentType);

        // Generate bibliography
        const bibliography = citationOptions.include_bibliography
            ? this.citationService.generateBibliography(selectedCitations, citationOptions.citation_style as 'business' | 'apa')
            : '';

        // Calculate metrics
        const metrics = this.citationService.calculateCitationMetrics(selectedCitations);

        // Enhance content with inline citations
        const enhancedContent = this.enhanceContentWithCitations(
            content,
            selectedCitations,
            citationContexts,
            citationOptions.citation_style,
            citationOptions.include_bibliography ? bibliography : ''
        );

        return {
            citations: selectedCitations,
            bibliography,
            citationContexts,
            metrics,
            enhancedContent
        };
    }

    /**
     * Extract relevant keywords from content for citation search
     */
    private extractKeywords(content: string, documentType: string): string[] {
        const baseKeywords: Record<string, string[]> = {
            'business_case': ['roi', 'business case', 'investment', 'cost benefit', 'financial analysis'],
            'market_analysis': ['market size', 'competition', 'market research', 'industry analysis'],
            'executive_onepager': ['strategy', 'executive summary', 'business strategy'],
            'pr_faq': ['product launch', 'press release', 'product announcement'],
            'competitive_analysis': ['competitive analysis', 'market positioning', 'competitor research'],
            'strategic_alignment': ['strategic planning', 'okr', 'company strategy', 'alignment'],
            'resource_optimization': ['resource allocation', 'optimization', 'efficiency', 'productivity'],
            'market_timing': ['market timing', 'product timing', 'market readiness']
        };

        // Get base keywords for document type
        const keywords = [...(baseKeywords[documentType] || [])];

        // Extract additional keywords from content
        const contentKeywords = this.extractContentKeywords(content);
        keywords.push(...contentKeywords);

        // Add common business terms
        keywords.push('saas', 'product management', 'digital transformation', 'customer success');

        return [...new Set(keywords)]; // Remove duplicates
    }

    /**
     * Extract keywords from content using simple text analysis
     */
    private extractContentKeywords(content: string): string[] {
        const keywords: string[] = [];

        // Common business and tech terms to look for
        const businessTerms = [
            'churn', 'retention', 'conversion', 'revenue', 'growth', 'acquisition',
            'automation', 'ai', 'machine learning', 'analytics', 'dashboard',
            'customer experience', 'user experience', 'agile', 'scrum',
            'cloud', 'api', 'integration', 'scalability', 'performance'
        ];

        const lowerContent = content.toLowerCase();

        businessTerms.forEach(term => {
            if (lowerContent.includes(term)) {
                keywords.push(term);
            }
        });

        return keywords;
    }

    /**
     * Create citation contexts based on content analysis
     */
    private createCitationContexts(
        content: string,
        citations: Citation[],
        documentType: string
    ): CitationContext[] {
        const contexts: CitationContext[] = [];

        // Map citations to relevant sections based on content
        const sections = this.identifyContentSections(content, documentType);

        citations.forEach((citation, index) => {
            // Find the most relevant section for this citation
            const relevantSection = this.findRelevantSection(citation, sections);

            contexts.push(this.citationService.addCitationContext(
                citation.id,
                relevantSection,
                citation.key_finding,
                'supporting'
            ));
        });

        return contexts;
    }

    /**
     * Identify content sections for citation placement
     */
    private identifyContentSections(content: string, documentType: string): string[] {
        const sectionPatterns: Record<string, string[]> = {
            'business_case': ['Problem', 'Solution', 'ROI Analysis', 'Risk Assessment', 'Recommendation'],
            'market_analysis': ['Market Size', 'Competition', 'Trends', 'Opportunities', 'Threats'],
            'executive_onepager': ['Executive Summary', 'Problem', 'Solution', 'Investment', 'Returns'],
            'competitive_analysis': ['Market Overview', 'Competitor Analysis', 'Positioning', 'Recommendations'],
            'strategic_alignment': ['Strategic Context', 'Alignment Assessment', 'Recommendations']
        };

        return sectionPatterns[documentType] || ['Overview', 'Analysis', 'Recommendations'];
    }

    /**
     * Find the most relevant section for a citation
     */
    private findRelevantSection(citation: Citation, sections: string[]): string {
        const keyFinding = citation.key_finding.toLowerCase();

        // Simple keyword matching to determine relevance
        if (keyFinding.includes('roi') || keyFinding.includes('cost') || keyFinding.includes('revenue')) {
            return sections.find(s => s.toLowerCase().includes('roi') || s.toLowerCase().includes('investment')) || sections[0];
        }

        if (keyFinding.includes('market') || keyFinding.includes('competition')) {
            return sections.find(s => s.toLowerCase().includes('market') || s.toLowerCase().includes('competition')) || sections[0];
        }

        if (keyFinding.includes('churn') || keyFinding.includes('retention')) {
            return sections.find(s => s.toLowerCase().includes('problem') || s.toLowerCase().includes('analysis')) || sections[0];
        }

        return sections[0]; // Default to first section
    }

    /**
     * Enhance content with inline citations and bibliography
     */
    private enhanceContentWithCitations(
        content: string,
        citations: Citation[],
        contexts: CitationContext[],
        style: 'business' | 'apa' | 'inline',
        bibliography: string
    ): string {
        let enhancedContent = content;

        // Add inline citations at relevant points
        contexts.forEach(context => {
            const citation = citations.find(c => c.id === context.citation_id);
            if (citation) {
                const formattedCitation = this.citationService.formatCitation(citation, style);

                // Find a good place to insert the citation
                const claimText = context.specific_claim.substring(0, 50); // First 50 chars
                const insertionPoint = enhancedContent.toLowerCase().indexOf(claimText.toLowerCase());

                if (insertionPoint !== -1) {
                    const endOfSentence = enhancedContent.indexOf('.', insertionPoint);
                    if (endOfSentence !== -1) {
                        enhancedContent = enhancedContent.substring(0, endOfSentence) +
                            ` ${formattedCitation.in_text_citation}` +
                            enhancedContent.substring(endOfSentence);
                    }
                }
            }
        });

        // Add bibliography at the end if requested
        if (bibliography) {
            enhancedContent += '\n\n' + bibliography;
        }

        return enhancedContent;
    }

    /**
     * Get citation requirements for a document type
     */
    getCitationRequirements(documentType: string) {
        return this.citationService.getCitationRequirements(documentType);
    }

    /**
     * Validate citation quality for a document
     */
    validateCitationQuality(citations: Citation[], documentType: string): {
        isValid: boolean;
        issues: string[];
        recommendations: string[];
        qualityScore: number;
    } {
        const requirements = this.getCitationRequirements(documentType);
        const metrics = this.citationService.calculateCitationMetrics(citations);
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check minimum citation count
        if (citations.length < requirements.minimum_citations) {
            issues.push(`Insufficient citations: ${citations.length} found, ${requirements.minimum_citations} required`);
            recommendations.push(`Add ${requirements.minimum_citations - citations.length} more relevant citations`);
        }

        // Check confidence levels
        const lowConfidenceCitations = citations.filter(c => c.confidence === 'low').length;
        if (lowConfidenceCitations > citations.length * 0.3) {
            issues.push('Too many low-confidence citations');
            recommendations.push('Replace low-confidence sources with more authoritative references');
        }

        // Check recency
        if (metrics.recency_score < 60) {
            issues.push('Citations are too old');
            recommendations.push('Include more recent sources from the last 12-18 months');
        }

        // Check diversity
        if (metrics.diversity_score < 40) {
            issues.push('Limited source diversity');
            recommendations.push('Include citations from different types of sources (academic, industry, consulting)');
        }

        // Calculate overall quality score
        const qualityScore = Math.round(
            (metrics.credibility_score * 0.4) +
            (metrics.recency_score * 0.3) +
            (metrics.diversity_score * 0.3)
        );

        return {
            isValid: issues.length === 0,
            issues,
            recommendations,
            qualityScore
        };
    }
}