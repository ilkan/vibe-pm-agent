# NVIDIA NIM Local Testing Script (PowerShell)
# 
# Comprehensive testing suite for local NVIDIA NIM deployment on Windows
# Supports testing chat completions, embeddings, and health checks

param(
    [string]$Command = "health",
    [string]$Url = $env:NIM_BASE_URL ?? "http://localhost:1234",
    [string]$Model = $env:NIM_MODEL ?? "nvidia-llama-3_1-nemotron-nano-8b-v1",
    [int]$Timeout = [int]($env:TIMEOUT ?? 30),
    [switch]$Verbose = [bool]($env:VERBOSE ?? $false),
    [switch]$Help
)

# Configuration
$NIM_BASE_URL = $Url.TrimEnd('/')
$NIM_MODEL = $Model
$TIMEOUT_SECONDS = $Timeout
$VERBOSE_OUTPUT = $Verbose

# Colors for output (if supported)
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Check dependencies
function Test-Dependencies {
    $curlAvailable = Get-Command curl -ErrorAction SilentlyContinue
    if (-not $curlAvailable) {
        Write-Error "curl is required but not found. Please install curl or use Invoke-WebRequest."
        return $false
    }
    
    $jqAvailable = Get-Command jq -ErrorAction SilentlyContinue
    if (-not $jqAvailable) {
        Write-Warning "jq is not installed. JSON responses will not be formatted."
        $script:JQ_AVAILABLE = $false
    } else {
        $script:JQ_AVAILABLE = $true
    }
    
    return $true
}

# Test basic connectivity
function Test-Connectivity {
    Write-Info "Testing connectivity to $NIM_BASE_URL..."
    
    try {
        $response = Invoke-WebRequest -Uri "$NIM_BASE_URL/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Successfully connected to NIM service"
            return $true
        }
    } catch {
        # Try alternative endpoint
        try {
            $response = Invoke-WebRequest -Uri "$NIM_BASE_URL/v1/models" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "Successfully connected to NIM service (via models endpoint)"
                return $true
            }
        } catch {
            Write-Error "Failed to connect to NIM service at $NIM_BASE_URL"
            Write-Info "Make sure the NVIDIA NIM service is running on localhost:1234"
            return $false
        }
    }
    
    return $false
}

# List available models
function Get-Models {
    Write-Info "Listing available models..."
    
    try {
        $response = Invoke-WebRequest -Uri "$NIM_BASE_URL/v1/models" -Method Get -TimeoutSec $TIMEOUT_SECONDS
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Available models:"
            
            $jsonResponse = $response.Content | ConvertFrom-Json
            if ($jsonResponse.data) {
                foreach ($model in $jsonResponse.data) {
                    Write-Host "  - $($model.id)"
                }
            } else {
                Write-Host "  No models found"
            }
            return $true
        }
    } catch {
        Write-Error "Failed to retrieve models list: $($_.Exception.Message)"
        return $false
    }
    
    return $false
}

# Test chat completion
function Test-ChatCompletion {
    param(
        [string]$Prompt = "Hello, how are you today?",
        [double]$Temperature = 0.7,
        [int]$MaxTokens = 100
    )
    
    Write-Info "Testing chat completion with prompt: '$Prompt'"
    
    $requestBody = @{
        model = $NIM_MODEL
        messages = @(
            @{
                role = "system"
                content = "You are a helpful assistant. Always answer in a friendly and concise manner."
            },
            @{
                role = "user"
                content = $Prompt
            }
        )
        temperature = $Temperature
        max_tokens = $MaxTokens
        stream = $false
    } | ConvertTo-Json -Depth 10
    
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri "$NIM_BASE_URL/v1/chat/completions" -Method Post -Body $requestBody -ContentType "application/json" -TimeoutSec $TIMEOUT_SECONDS
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Chat completion successful ($([math]::Round($duration))ms)"
            
            $jsonResponse = $response.Content | ConvertFrom-Json
            $assistantResponse = $jsonResponse.choices[0].message.content
            $tokensUsed = $jsonResponse.usage.total_tokens
            $finishReason = $jsonResponse.choices[0].finish_reason
            
            Write-Host "  Response: $assistantResponse"
            Write-Host "  Tokens used: $tokensUsed"
            Write-Host "  Finish reason: $finishReason"
            Write-Host "  Duration: $([math]::Round($duration))ms"
            
            if ($VERBOSE_OUTPUT) {
                Write-Host "  Full response:"
                Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10)
            }
            
            return $true
        }
    } catch {
        Write-Error "Chat completion failed: $($_.Exception.Message)"
        return $false
    }
    
    return $false
}

# Test embedding generation
function Test-Embedding {
    param(
        [string]$Text = "This is a test sentence for embedding generation.",
        [string]$EmbeddingModel = "text-embedding-ada-002"
    )
    
    Write-Info "Testing embedding generation with text: '$Text'"
    
    $requestBody = @{
        input = $Text
        model = $EmbeddingModel
        encoding_format = "float"
    } | ConvertTo-Json -Depth 10
    
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri "$NIM_BASE_URL/v1/embeddings" -Method Post -Body $requestBody -ContentType "application/json" -TimeoutSec $TIMEOUT_SECONDS
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            Write-Success "Embedding generation successful ($([math]::Round($duration))ms)"
            
            $jsonResponse = $response.Content | ConvertFrom-Json
            $embeddingDimensions = $jsonResponse.data[0].embedding.Count
            $tokensUsed = $jsonResponse.usage.total_tokens
            
            Write-Host "  Embedding dimensions: $embeddingDimensions"
            Write-Host "  Tokens used: $tokensUsed"
            Write-Host "  Duration: $([math]::Round($duration))ms"
            
            return $true
        }
    } catch {
        Write-Error "Embedding generation failed: $($_.Exception.Message)"
        return $false
    }
    
    return $false
}

# Run performance test
function Test-Performance {
    param(
        [int]$Iterations = 5,
        [string]$Prompt = "Explain quantum computing in simple terms."
    )
    
    Write-Info "Running performance test with $Iterations iterations..."
    
    $totalTime = 0
    $successfulRequests = 0
    $failedRequests = 0
    $minTime = [double]::MaxValue
    $maxTime = 0
    $responseTimes = @()
    
    for ($i = 1; $i -le $Iterations; $i++) {
        Write-Host "  Request $i/$Iterations... " -NoNewline
        
        $requestBody = @{
            model = $NIM_MODEL
            messages = @(
                @{
                    role = "user"
                    content = $Prompt
                }
            )
            max_tokens = 50
        } | ConvertTo-Json -Depth 10
        
        $startTime = Get-Date
        
        try {
            $response = Invoke-WebRequest -Uri "$NIM_BASE_URL/v1/chat/completions" -Method Post -Body $requestBody -ContentType "application/json" -TimeoutSec $TIMEOUT_SECONDS
            
            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalMilliseconds
            
            if ($response.StatusCode -eq 200) {
                Write-Host "$([math]::Round($duration))ms ✓" -ForegroundColor $Colors.Green
                $successfulRequests++
                $totalTime += $duration
                $responseTimes += $duration
                
                if ($duration -lt $minTime) { $minTime = $duration }
                if ($duration -gt $maxTime) { $maxTime = $duration }
            } else {
                Write-Host "FAILED (HTTP $($response.StatusCode))" -ForegroundColor $Colors.Red
                $failedRequests++
            }
        } catch {
            Write-Host "FAILED ($($_.Exception.Message))" -ForegroundColor $Colors.Red
            $failedRequests++
        }
        
        # Small delay between requests
        Start-Sleep -Milliseconds 100
    }
    
    if ($successfulRequests -gt 0) {
        $avgTime = $totalTime / $successfulRequests
        $successRate = ($successfulRequests * 100) / $Iterations
        
        Write-Success "Performance test completed"
        Write-Host "  Successful requests: $successfulRequests/$Iterations ($([math]::Round($successRate))%)"
        Write-Host "  Average response time: $([math]::Round($avgTime))ms"
        Write-Host "  Min response time: $([math]::Round($minTime))ms"
        Write-Host "  Max response time: $([math]::Round($maxTime))ms"
        Write-Host "  Total time: $([math]::Round($totalTime))ms"
        
        return $true
    } else {
        Write-Error "All performance test requests failed"
        return $false
    }
}

# Health check
function Invoke-HealthCheck {
    Write-Info "Performing comprehensive health check..."
    
    $overallStatus = $true
    
    # Test connectivity
    if (-not (Test-Connectivity)) {
        $overallStatus = $false
    }
    
    # List models
    if (-not (Get-Models)) {
        $overallStatus = $false
    }
    
    # Test basic chat completion
    if (-not (Test-ChatCompletion -Prompt "Health check test" -Temperature 0.1 -MaxTokens 10)) {
        $overallStatus = $false
    }
    
    # Test embedding (optional)
    Write-Info "Testing embedding generation (optional)..."
    if (Test-Embedding -Text "Health check") {
        Write-Success "Embedding service is available"
    } else {
        Write-Warning "Embedding service is not available (this may be expected)"
    }
    
    if ($overallStatus) {
        Write-Success "Health check passed - NIM service is functioning correctly"
    } else {
        Write-Error "Health check failed - Some services are not working properly"
    }
    
    return $overallStatus
}

# Interactive test mode
function Start-InteractiveMode {
    Write-Info "Entering interactive test mode. Type 'help' for commands or 'quit' to exit."
    
    while ($true) {
        Write-Host "nim-test> " -NoNewline
        $input = Read-Host
        $parts = $input -split ' ', 2
        $command = $parts[0]
        $args = if ($parts.Length -gt 1) { $parts[1] } else { "" }
        
        switch ($command.ToLower()) {
            "help" {
                Write-Host "Available commands:"
                Write-Host "  chat <prompt>     - Test chat completion with custom prompt"
                Write-Host "  embed <text>      - Test embedding generation with custom text"
                Write-Host "  models            - List available models"
                Write-Host "  health            - Run health check"
                Write-Host "  perf [iterations] - Run performance test"
                Write-Host "  connect           - Test connectivity"
                Write-Host "  quit              - Exit interactive mode"
            }
            "chat" {
                Test-ChatCompletion -Prompt $args
            }
            "embed" {
                Test-Embedding -Text $args
            }
            "models" {
                Get-Models
            }
            "health" {
                Invoke-HealthCheck
            }
            "perf" {
                $iterations = if ($args -and [int]::TryParse($args, [ref]$null)) { [int]$args } else { 5 }
                Test-Performance -Iterations $iterations
            }
            "connect" {
                Test-Connectivity
            }
            { $_ -in @("quit", "exit") } {
                Write-Info "Exiting interactive mode"
                return
            }
            "" {
                # Empty command, do nothing
            }
            default {
                Write-Error "Unknown command: $command. Type 'help' for available commands."
            }
        }
    }
}

# Show usage information
function Show-Usage {
    Write-Host @"
NVIDIA NIM Local Testing Script (PowerShell)

Usage: .\test-local-nim.ps1 [COMMAND] [OPTIONS]

Commands:
  connectivity    Test basic connectivity to NIM service
  models         List available models
  chat           Test chat completion
  embed          Test embedding generation
  performance    Run performance benchmarks
  health         Run comprehensive health check
  interactive    Enter interactive testing mode
  help           Show this help message

Options:
  -Url URL       Set NIM base URL (default: http://localhost:1234)
  -Model MODEL   Set model name (default: nvidia-llama-3_1-nemotron-nano-8b-v1)
  -Timeout SEC   Set request timeout (default: 30)
  -Verbose       Enable verbose output

Environment Variables:
  NIM_BASE_URL   Base URL for NIM service
  NIM_MODEL      Model name to use for testing
  TIMEOUT        Request timeout in seconds
  VERBOSE        Enable verbose output (true/false)

Examples:
  .\test-local-nim.ps1 health                                    # Run health check
  .\test-local-nim.ps1 chat -Verbose                            # Test chat with verbose output
  .\test-local-nim.ps1 performance                              # Run performance test
  .\test-local-nim.ps1 -Url http://localhost:8080 connectivity  # Test different URL
  .\test-local-nim.ps1 interactive                              # Enter interactive mode

"@
}

# Main execution
function Main {
    if ($Help) {
        Show-Usage
        return
    }
    
    Write-Info "NVIDIA NIM Local Testing Suite (PowerShell)"
    Write-Info "Target: $NIM_BASE_URL"
    Write-Info "Model: $NIM_MODEL"
    Write-Info "Timeout: $($TIMEOUT_SECONDS)s"
    Write-Host ""
    
    if (-not (Test-Dependencies)) {
        return
    }
    
    switch ($Command.ToLower()) {
        { $_ -in @("connectivity", "connect") } {
            Test-Connectivity
        }
        { $_ -in @("models", "model") } {
            Get-Models
        }
        { $_ -in @("chat", "completion") } {
            Test-ChatCompletion
        }
        { $_ -in @("embed", "embedding") } {
            Test-Embedding
        }
        { $_ -in @("performance", "perf", "benchmark") } {
            Test-Performance
        }
        { $_ -in @("health", "check") } {
            Invoke-HealthCheck
        }
        { $_ -in @("interactive", "i") } {
            Start-InteractiveMode
        }
        { $_ -in @("help", "--help", "-h") } {
            Show-Usage
        }
        default {
            Write-Error "Unknown command: $Command"
            Show-Usage
        }
    }
}

# Run main function
Main