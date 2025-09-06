// Market Data Models - Unique Public Datasets Integration
// TypeScript interfaces for market data integration and competitive intelligence

/**
 * Configuration for external data sources
 */
export interface DataSourceConfig {
  name: string;
  base_url: string;
  api_key_required: boolean;
  rate_limit: {
    requests: number;
    per_seconds: number;
  };
  data_types: string[];
  update_frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  reliability_score: number; // 0-100
  coverage: string;
  unique_features: string[];
}

/**
 * Market data source information
 */
export interface MarketDataSource {
  source_id: string;
  name: string;
  type: 'government' | 'commercial' | 'academic' | 'open_source';
  credibility_rating: 'A' | 'B' | 'C';
  last_updated: string;
  data_coverage: string[];
  access_method: 'api' | 'download' | 'scraping';
  cost: 'free' | 'subscription' | 'per_request';
}

/**
 * Company financial data from SEC filings
 */
export interface CompanyFinancials {
  company_name: string;
  ticker_symbol: string;
  fiscal_year: number;
  revenue: number;
  net_income: number;
  total_assets: number;
  market_cap: number;
  employees: number;
  filing_date: string;
  data_source: string;
  confidence_score: number;
}

/**
 * Market trends and economic indicators
 */
export interface MarketTrends {
  trend_name: string;
  current_value: number;
  historical_average: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidence_interval: {
    lower: number;
    upper: number;
  };
  data_source: string;
  last_updated: string;
  industry_impact: string;
}

/**
 * Industry benchmarks and metrics
 */
export interface IndustryBenchmarks {
  industry: string;
  metrics: {
    [metric_name: string]: {
      median: number;
      percentile_25: number;
      percentile_75: number;
      top_decile: number;
      sample_size: number;
      data_source: string;
    };
  };
  geographic_scope: string;
  time_period: string;
  last_updated: string;
}

/**
 * Comprehensive competitive intelligence
 */
export interface CompetitiveIntelligence {
  company_name: string;
  industry: string;
  analysis_type: 'competitive' | 'market_sizing' | 'trend_analysis';
  data_sources: string[];
  financial_metrics: CompanyFinancials | {};
  market_position: {
    market_share?: number;
    ranking?: number;
    competitive_advantages?: string[];
    weaknesses?: string[];
  };
  competitive_landscape: CompetitorProfile[];
  market_trends: MarketTrends[];
  data_quality_score: number;
  last_updated: string;
  confidence_intervals: {
    [metric: string]: {
      lower: number;
      upper: number;
      confidence_level: number;
    };
  };
  unique_insights: UniqueInsight[];
}

/**
 * Competitor profile information
 */
export interface CompetitorProfile {
  company_name: string;
  market_share: number;
  revenue_estimate: number;
  employee_count: number;
  funding_raised?: number;
  key_products: string[];
  competitive_strengths: string[];
  recent_developments: string[];
  data_sources: string[];
  confidence_score: number;
}

/**
 * Unique insights from proprietary analysis
 */
export interface UniqueInsight {
  insight_type: 'innovation_analysis' | 'developer_ecosystem' | 'patent_landscape' | 'funding_patterns' | 'talent_flow';
  description: string;
  data: any;
  confidence_score: number;
  methodology?: string;
  limitations?: string[];
}

/**
 * Market metrics aggregation
 */
export interface MarketMetrics {
  metric_name: string;
  current_value: number;
  historical_values: {
    date: string;
    value: number;
  }[];
  benchmark_comparison: {
    industry_average: number;
    top_quartile: number;
    bottom_quartile: number;
  };
  data_sources: string[];
  confidence_score: number;
  last_updated: string;
}

/**
 * Data validation rules
 */
export interface DataValidation {
  required_fields: string[];
  data_types: Record<string, string>;
  range_checks?: Record<string, { min: number; max: number }>;
  freshness_requirement: number; // days
}

/**
 * Market data API response
 */
export interface MarketDataResponse {
  success: boolean;
  data: any;
  metadata: {
    source: string;
    timestamp: string;
    rate_limit_remaining: number;
    data_quality_score: number;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Patent and innovation data
 */
export interface PatentData {
  company_name: string;
  total_patents: number;
  patents_by_year: Record<string, number>;
  patent_categories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  innovation_metrics: {
    r_and_d_spending?: number;
    patent_quality_score: number;
    citation_impact: number;
    technology_areas: string[];
  };
  competitive_position: {
    industry_rank: number;
    patent_velocity: number; // patents per year
    innovation_index: number;
  };
  data_source: string;
  last_updated: string;
}

/**
 * GitHub ecosystem data
 */
export interface GitHubEcosystemData {
  organization: string;
  public_repositories: number;
  total_stars: number;
  total_forks: number;
  active_contributors: number;
  programming_languages: {
    language: string;
    percentage: number;
    repositories: number;
  }[];
  activity_metrics: {
    commits_per_month: number;
    issues_opened: number;
    issues_closed: number;
    pull_requests: number;
    community_engagement_score: number;
  };
  technology_adoption: {
    trending_technologies: string[];
    framework_usage: Record<string, number>;
    innovation_indicators: string[];
  };
  developer_insights: {
    contributor_growth_rate: number;
    geographic_distribution: Record<string, number>;
    experience_levels: Record<string, number>;
  };
}

/**
 * Economic indicators from government sources
 */
export interface EconomicIndicators {
  indicator_name: string;
  current_value: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  historical_data: {
    date: string;
    value: number;
  }[];
  forecasts?: {
    date: string;
    predicted_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }[];
  industry_correlations: {
    industry: string;
    correlation_coefficient: number;
    impact_description: string;
  }[];
  data_source: string;
  methodology: string;
  last_updated: string;
}

/**
 * Startup ecosystem data from Crunchbase-style sources
 */
export interface StartupEcosystemData {
  region: string;
  time_period: string;
  funding_metrics: {
    total_funding: number;
    number_of_deals: number;
    average_deal_size: number;
    median_deal_size: number;
  };
  stage_breakdown: {
    stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'later_stage';
    deal_count: number;
    total_amount: number;
    average_amount: number;
  }[];
  industry_distribution: {
    industry: string;
    deal_count: number;
    funding_amount: number;
    percentage_of_total: number;
  }[];
  investor_activity: {
    active_investors: number;
    new_investors: number;
    repeat_investors: number;
    top_investors: {
      name: string;
      deals_count: number;
      total_invested: number;
    }[];
  };
  exit_activity: {
    ipos: number;
    acquisitions: number;
    total_exit_value: number;
  };
  trends: {
    hot_sectors: string[];
    emerging_technologies: string[];
    geographic_shifts: string[];
  };
}

/**
 * Labor market data from Bureau of Labor Statistics
 */
export interface LaborMarketData {
  industry: string;
  geographic_area: string;
  employment_metrics: {
    total_employment: number;
    employment_growth_rate: number;
    unemployment_rate: number;
    job_openings: number;
    quit_rate: number;
  };
  wage_statistics: {
    median_wage: number;
    wage_growth_rate: number;
    wage_percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
  };
  productivity_metrics: {
    output_per_hour: number;
    productivity_growth: number;
    unit_labor_costs: number;
  };
  skills_demand: {
    skill: string;
    demand_level: 'high' | 'medium' | 'low';
    growth_trend: 'increasing' | 'stable' | 'decreasing';
    median_salary: number;
  }[];
  data_source: string;
  last_updated: string;
}

/**
 * Proprietary PM analysis frameworks
 */
export interface ProprietaryPMFramework {
  framework_name: string;
  description: string;
  methodology: string;
  input_requirements: string[];
  output_format: string;
  confidence_calculation: string;
  validation_criteria: string[];
  unique_differentiators: string[];
  use_cases: string[];
  limitations: string[];
}

/**
 * Market sizing analysis
 */
export interface MarketSizingAnalysis {
  market_name: string;
  geographic_scope: string;
  sizing_methodology: 'top_down' | 'bottom_up' | 'hybrid';
  market_size: {
    tam: number; // Total Addressable Market
    sam: number; // Serviceable Addressable Market
    som: number; // Serviceable Obtainable Market
  };
  growth_projections: {
    year: number;
    projected_size: number;
    growth_rate: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }[];
  market_drivers: {
    driver: string;
    impact_level: 'high' | 'medium' | 'low';
    description: string;
  }[];
  competitive_dynamics: {
    market_concentration: number; // HHI index
    top_players_market_share: number;
    barriers_to_entry: string[];
    competitive_intensity: 'high' | 'medium' | 'low';
  };
  data_sources: string[];
  assumptions: string[];
  confidence_score: number;
  last_updated: string;
}

/**
 * Real-time market sentiment data
 */
export interface MarketSentimentData {
  topic: string;
  sentiment_score: number; // -100 to +100
  confidence: number; // 0-100
  data_sources: {
    source_type: 'social_media' | 'news' | 'analyst_reports' | 'earnings_calls';
    volume: number;
    sentiment_contribution: number;
  }[];
  trending_keywords: {
    keyword: string;
    frequency: number;
    sentiment: number;
  }[];
  geographic_breakdown: {
    region: string;
    sentiment_score: number;
    sample_size: number;
  }[];
  time_series: {
    timestamp: string;
    sentiment_score: number;
    volume: number;
  }[];
  last_updated: string;
}