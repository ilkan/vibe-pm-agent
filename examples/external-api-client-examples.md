# External API Client Examples

This document provides examples for integrating with the Vibe PM Agent external API using various programming languages and frameworks.

## Authentication

All external API requests require an API key in the `X-API-Key` header:

```
X-API-Key: your-api-key-here
```

## Base URL

Replace `{api-gateway-url}` with your actual API Gateway URL:

```
https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

## JavaScript/TypeScript Examples

### Basic Fetch API

```typescript
const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
const API_KEY = 'your-api-key-here';

async function analyzeBusinessOpportunity(idea: string, marketContext?: any) {
  const response = await fetch(`${API_BASE_URL}/business-analysis/analyze-opportunity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      idea,
      market_context: marketContext
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Usage
analyzeBusinessOpportunity(
  'AI-powered code review assistant',
  {
    industry: 'developer_tools',
    budget_range: 'medium',
    timeline: '6_months'
  }
).then(result => {
  console.log('Analysis result:', result);
}).catch(error => {
  console.error('Error:', error);
});
```

### Axios Client

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  },
  timeout: 30000 // 30 second timeout
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - check your API key');
    } else if (error.response?.status === 403) {
      console.error('Permission denied - check API key permissions');
    } else if (error.response?.status === 429) {
      console.error('Rate limit exceeded - please wait before retrying');
    }
    return Promise.reject(error);
  }
);

// Business analysis functions
export const businessAnalysis = {
  async analyzeOpportunity(idea: string, marketContext?: any) {
    const response = await apiClient.post('/business-analysis/analyze-opportunity', {
      idea,
      market_context: marketContext
    });
    return response.data;
  },

  async generateBusinessCase(opportunityAnalysis: string, financialInputs?: any) {
    const response = await apiClient.post('/business-analysis/generate-case', {
      opportunity_analysis: opportunityAnalysis,
      financial_inputs: financialInputs
    });
    return response.data;
  },

  async validateIdea(idea: string, criteria: string[]) {
    const response = await apiClient.post('/business-analysis/validate-idea', {
      idea,
      criteria
    });
    return response.data;
  }
};

// Communications functions
export const communications = {
  async createStakeholderCommunication(businessCase: string, communicationType: string, audience: string) {
    const response = await apiClient.post('/communications/stakeholder-communication', {
      business_case: businessCase,
      communication_type: communicationType,
      audience
    });
    return response.data;
  },

  async generateExecutiveOnepager(projectInfo: string, audience?: string) {
    const response = await apiClient.post('/communications/executive-onepager', {
      project_info: projectInfo,
      audience
    });
    return response.data;
  }
};

// Interview preparation functions
export const interviewPrep = {
  async startSession(roleLevel: string, targetCompany?: string) {
    const response = await apiClient.post('/interview-prep/start-session', {
      role_level: roleLevel,
      target_company: targetCompany
    });
    return response.data;
  },

  async generateQuestion(roleLevel: string, questionCategory: string, difficulty?: number) {
    const response = await apiClient.post('/interview-prep/generate-question', {
      role_level: roleLevel,
      question_category: questionCategory,
      difficulty_level: difficulty
    });
    return response.data;
  },

  async evaluateResponse(questionId: string, userResponse: string) {
    const response = await apiClient.post('/interview-prep/evaluate-response', {
      question_id: questionId,
      user_response: userResponse
    });
    return response.data;
  }
};
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { businessAnalysis } from './api-client';

export function useBusinessAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOpportunity = useCallback(async (idea: string, marketContext?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await businessAnalysis.analyzeOpportunity(idea, marketContext);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyzeOpportunity,
    loading,
    error
  };
}

// Usage in component
function BusinessAnalysisForm() {
  const { analyzeOpportunity, loading, error } = useBusinessAnalysis();
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const analysis = await analyzeOpportunity(idea, {
        industry: 'saas',
        budget_range: 'medium'
      });
      setResult(analysis);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Enter your business idea..."
        disabled={loading}
      />
      <button type="submit" disabled={loading || !idea.trim()}>
        {loading ? 'Analyzing...' : 'Analyze Opportunity'}
      </button>
      {error && <div className="error">{error}</div>}
      {result && <div className="result">{JSON.stringify(result, null, 2)}</div>}
    </form>
  );
}
```

## Python Examples

### Basic Requests

```python
import requests
import json
from typing import Optional, Dict, Any

class VibePMAgentClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        })
        self.session.timeout = 30

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                raise Exception("Authentication failed - check your API key")
            elif response.status_code == 403:
                raise Exception("Permission denied - check API key permissions")
            elif response.status_code == 429:
                raise Exception("Rate limit exceeded - please wait before retrying")
            else:
                raise Exception(f"API request failed: {response.status_code} {response.text}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

    # Business Analysis Methods
    def analyze_opportunity(self, idea: str, market_context: Optional[Dict] = None) -> Dict[str, Any]:
        return self._make_request('POST', '/business-analysis/analyze-opportunity', {
            'idea': idea,
            'market_context': market_context
        })

    def generate_business_case(self, opportunity_analysis: str, financial_inputs: Optional[Dict] = None) -> Dict[str, Any]:
        return self._make_request('POST', '/business-analysis/generate-case', {
            'opportunity_analysis': opportunity_analysis,
            'financial_inputs': financial_inputs
        })

    def validate_idea(self, idea: str, criteria: list) -> Dict[str, Any]:
        return self._make_request('POST', '/business-analysis/validate-idea', {
            'idea': idea,
            'criteria': criteria
        })

    # Communications Methods
    def create_stakeholder_communication(self, business_case: str, communication_type: str, audience: str) -> Dict[str, Any]:
        return self._make_request('POST', '/communications/stakeholder-communication', {
            'business_case': business_case,
            'communication_type': communication_type,
            'audience': audience
        })

    def generate_executive_onepager(self, project_info: str, audience: Optional[str] = None) -> Dict[str, Any]:
        return self._make_request('POST', '/communications/executive-onepager', {
            'project_info': project_info,
            'audience': audience
        })

    # Interview Preparation Methods
    def start_interview_session(self, role_level: str, target_company: Optional[str] = None) -> Dict[str, Any]:
        return self._make_request('POST', '/interview-prep/start-session', {
            'role_level': role_level,
            'target_company': target_company
        })

    def generate_interview_question(self, role_level: str, question_category: str, difficulty: Optional[int] = None) -> Dict[str, Any]:
        return self._make_request('POST', '/interview-prep/generate-question', {
            'role_level': role_level,
            'question_category': question_category,
            'difficulty_level': difficulty
        })

# Usage example
if __name__ == "__main__":
    client = VibePMAgentClient(
        base_url='https://your-api-id.execute-api.us-east-1.amazonaws.com/dev',
        api_key='your-api-key-here'
    )

    try:
        # Analyze a business opportunity
        result = client.analyze_opportunity(
            idea='AI-powered customer support automation',
            market_context={
                'industry': 'saas',
                'budget_range': 'large',
                'timeline': '12_months'
            }
        )
        print("Analysis Result:")
        print(json.dumps(result, indent=2))

        # Generate business case
        business_case = client.generate_business_case(
            opportunity_analysis=result.get('analysis', ''),
            financial_inputs={
                'development_cost': 500000,
                'expected_revenue': 2000000,
                'time_to_market': 12
            }
        )
        print("\nBusiness Case:")
        print(json.dumps(business_case, indent=2))

    except Exception as e:
        print(f"Error: {e}")
```

### Async Python with aiohttp

```python
import aiohttp
import asyncio
import json
from typing import Optional, Dict, Any

class AsyncVibePMAgentClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    async def _make_request(self, session: aiohttp.ClientSession, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with session.request(method, url, json=data, headers=self.headers) as response:
                if response.status == 401:
                    raise Exception("Authentication failed - check your API key")
                elif response.status == 403:
                    raise Exception("Permission denied - check API key permissions")
                elif response.status == 429:
                    raise Exception("Rate limit exceeded - please wait before retrying")
                
                response.raise_for_status()
                return await response.json()
        except aiohttp.ClientError as e:
            raise Exception(f"Network error: {str(e)}")

    async def analyze_opportunity(self, idea: str, market_context: Optional[Dict] = None) -> Dict[str, Any]:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            return await self._make_request(session, 'POST', '/business-analysis/analyze-opportunity', {
                'idea': idea,
                'market_context': market_context
            })

    async def batch_analysis(self, ideas: list) -> list:
        """Analyze multiple ideas concurrently"""
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            tasks = []
            for idea in ideas:
                task = self._make_request(session, 'POST', '/business-analysis/analyze-opportunity', {
                    'idea': idea
                })
                tasks.append(task)
            
            return await asyncio.gather(*tasks, return_exceptions=True)

# Usage example
async def main():
    client = AsyncVibePMAgentClient(
        base_url='https://your-api-id.execute-api.us-east-1.amazonaws.com/dev',
        api_key='your-api-key-here'
    )

    # Single analysis
    result = await client.analyze_opportunity(
        'AI-powered code review assistant',
        {'industry': 'developer_tools'}
    )
    print(json.dumps(result, indent=2))

    # Batch analysis
    ideas = [
        'AI-powered customer support',
        'Automated testing platform',
        'Real-time collaboration tool'
    ]
    results = await client.batch_analysis(ideas)
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"Idea {i+1} failed: {result}")
        else:
            print(f"Idea {i+1} result: {result.get('summary', 'No summary')}")

if __name__ == "__main__":
    asyncio.run(main())
```

## cURL Examples

### Business Analysis

```bash
# Analyze business opportunity
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/business-analysis/analyze-opportunity" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "idea": "AI-powered code review assistant",
    "market_context": {
      "industry": "developer_tools",
      "budget_range": "medium",
      "timeline": "6_months"
    }
  }'

# Generate business case
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/business-analysis/generate-case" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "opportunity_analysis": "Market analysis shows strong demand...",
    "financial_inputs": {
      "development_cost": 500000,
      "expected_revenue": 2000000,
      "operational_cost": 100000,
      "time_to_market": 12
    }
  }'

# Quick idea validation
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/business-analysis/validate-idea" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "idea": "AI-powered customer support automation",
    "criteria": ["market_viability", "technical_feasibility", "competitive_advantage"]
  }'
```

### Interview Preparation

```bash
# Start interview preparation session
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/interview-prep/start-session" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "role_level": "Senior PM",
    "target_company": "Google",
    "preparation_timeline": "2 weeks"
  }'

# Generate interview question
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/interview-prep/generate-question" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "role_level": "PM",
    "question_category": "product_sense",
    "difficulty_level": 3,
    "company_context": "Google"
  }'

# Evaluate interview response
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/interview-prep/evaluate-response" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "question_id": "q123",
    "user_response": "I would approach this by first understanding the user needs...",
    "evaluation_focus": ["frameworks", "structure", "metrics"]
  }'
```

### Communications

```bash
# Generate executive one-pager
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/communications/executive-onepager" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "project_info": "AI-powered customer support automation project with $2M revenue potential",
    "audience": "executives"
  }'

# Create stakeholder communication
curl -X POST "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/communications/stakeholder-communication" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "business_case": "Comprehensive business case showing strong ROI...",
    "communication_type": "board_presentation",
    "audience": "board"
  }'
```

## Error Handling Examples

### JavaScript Error Handling

```typescript
async function handleApiCall() {
  try {
    const result = await businessAnalysis.analyzeOpportunity('My idea');
    return result;
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle authentication error
      console.error('API key is invalid or missing');
      // Redirect to login or show API key input
    } else if (error.response?.status === 403) {
      // Handle permission error
      console.error('API key lacks required permissions');
      // Show upgrade message or contact admin
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      console.error('Rate limit exceeded');
      const retryAfter = error.response?.headers['retry-after'];
      // Wait and retry or show rate limit message
    } else {
      // Handle other errors
      console.error('API call failed:', error.message);
    }
    throw error;
  }
}
```

### Python Error Handling

```python
import time
from requests.exceptions import HTTPError

def handle_api_call_with_retry(client, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = client.analyze_opportunity('My idea')
            return result
        except Exception as e:
            if "Rate limit exceeded" in str(e) and attempt < max_retries - 1:
                # Exponential backoff for rate limiting
                wait_time = 2 ** attempt
                print(f"Rate limited, waiting {wait_time} seconds...")
                time.sleep(wait_time)
                continue
            elif "Authentication failed" in str(e):
                print("API key is invalid - please check your configuration")
                break
            elif "Permission denied" in str(e):
                print("API key lacks required permissions")
                break
            else:
                print(f"API call failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                break
    
    raise Exception("API call failed after all retries")
```

## Best Practices

### 1. API Key Management

```typescript
// Store API key securely (not in code)
const API_KEY = process.env.VIBE_PM_AGENT_API_KEY;

// Validate API key before making requests
if (!API_KEY) {
  throw new Error('VIBE_PM_AGENT_API_KEY environment variable is required');
}
```

### 2. Request Timeout and Retry Logic

```typescript
const apiClient = axios.create({
  timeout: 30000, // 30 second timeout
  retry: 3,
  retryDelay: (retryCount) => retryCount * 1000 // Exponential backoff
});
```

### 3. Response Caching

```typescript
const cache = new Map();

async function cachedAnalyzeOpportunity(idea: string) {
  const cacheKey = `analyze_${idea}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = await businessAnalysis.analyzeOpportunity(idea);
  cache.set(cacheKey, result);
  
  // Cache for 1 hour
  setTimeout(() => cache.delete(cacheKey), 3600000);
  
  return result;
}
```

### 4. Rate Limit Handling

```typescript
class RateLimitedClient {
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute = 60;
  private requestTimes: number[] = [];

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      // Check rate limit
      const now = Date.now();
      this.requestTimes = this.requestTimes.filter(time => now - time < 60000);

      if (this.requestTimes.length >= this.requestsPerMinute) {
        // Wait until we can make another request
        const oldestRequest = Math.min(...this.requestTimes);
        const waitTime = 60000 - (now - oldestRequest);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const request = this.requestQueue.shift()!;
      this.requestTimes.push(now);
      await request();
    }

    this.processing = false;
  }
}
```

This completes the external API client examples with comprehensive coverage of different programming languages, error handling, and best practices.