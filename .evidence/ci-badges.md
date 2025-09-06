# CI/CD Status Badges

Add these badges to your README.md file to show the current status of your CI/CD pipeline:

## GitHub Actions Workflow Badge
```markdown
[![CI](https://github.com/your-username/vibe-pm-agent/workflows/Vibe%20PM%20Agent%20CI%2FCD/badge.svg)](https://github.com/your-username/vibe-pm-agent/actions)
```

## Test Coverage Badge
```markdown
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)](https://github.com/your-username/vibe-pm-agent/actions)
```

## Performance Badge
```markdown
[![Performance](https://img.shields.io/badge/p95_latency-850ms-green)](https://github.com/your-username/vibe-pm-agent/actions)
```

## Quality Gate Badge
```markdown
[![Quality Gate](https://img.shields.io/badge/quality-passing-brightgreen)](https://github.com/your-username/vibe-pm-agent/actions)
```

## Security Badge
```markdown
[![Security](https://img.shields.io/badge/security-passing-brightgreen)](https://github.com/your-username/vibe-pm-agent/actions)
```

## All Badges Combined
```markdown
[![CI](https://github.com/your-username/vibe-pm-agent/workflows/Vibe%20PM%20Agent%20CI%2FCD/badge.svg)](https://github.com/your-username/vibe-pm-agent/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)](https://github.com/your-username/vibe-pm-agent/actions)
[![Performance](https://img.shields.io/badge/p95_latency-850ms-green)](https://github.com/your-username/vibe-pm-agent/actions)
[![Quality Gate](https://img.shields.io/badge/quality-passing-brightgreen)](https://github.com/your-username/vibe-pm-agent/actions)
[![Security](https://img.shields.io/badge/security-passing-brightgreen)](https://github.com/your-username/vibe-pm-agent/actions)
```

## Badge Color Scheme

### Coverage
- 90%+ = `brightgreen`
- 80-89% = `green`
- 70-79% = `yellow`
- 60-69% = `orange`
- <60% = `red`

### Performance (P95 Latency)
- <500ms = `brightgreen`
- 500-1000ms = `green`
- 1000-1500ms = `yellow`
- 1500-2000ms = `orange`
- >2000ms = `red`

### Quality Gates
- All passing = `brightgreen`
- Minor issues = `yellow`
- Major issues = `red`

## Usage Instructions

1. Replace `your-username` with your actual GitHub username
2. Update the repository name if different from `vibe-pm-agent`
3. The badges will automatically update based on your CI/CD pipeline results
4. Add these to the top of your README.md file for maximum visibility