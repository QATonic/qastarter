# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Please **do not** report security vulnerabilities through public GitHub issues.

### 2. Report Privately

Send details to: **security@qatonic.com** (or create a private security advisory)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | Within 48 hours |
| Initial Assessment | Within 7 days |
| Fix Timeline | Within 30 days |
| Public Disclosure | After fix is released |

### 4. Recognition

We appreciate responsible disclosure and may acknowledge security researchers:
- In release notes
- In SECURITY.md 
- On our website (with permission)

## Security Best Practices

When contributing to QAStarter:

1. **No Hardcoded Secrets** - Never commit API keys, passwords, or tokens
2. **Use Environment Variables** - Use `.env` files for local secrets (ignored by git)
3. **Input Validation** - Validate all user inputs on both client and server
4. **Dependencies** - Keep dependencies updated to avoid known vulnerabilities

## Security Features

QAStarter implements:
- ✅ Helmet.js for security headers
- ✅ CORS with origin validation
- ✅ Rate limiting
- ✅ Input validation
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities

Thank you for helping keep QAStarter safe! 🛡️
