# Contributing to QAStarter

First off, thank you for considering contributing to QAStarter! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project follows a simple code of conduct: be respectful, inclusive, and constructive. We're all here to build something great together.

## How Can I Contribute?

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/QATonic/QAStarter/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/OS information

### 💡 Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use case / why it's needed
   - Proposed implementation (optional)

### 🔧 Contributing Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### 📝 Improving Documentation

Documentation improvements are always welcome! This includes:
- README updates
- Code comments
- Template documentation
- Tutorial content

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone your fork
git clone https://github.com/QATonic/qastarter.git
cd qastarter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
QAStarter/
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       └── pages/        # Page components
├── server/           # Express backend
│   ├── templates/    # Template packs (46+)
│   └── services/     # Business logic
└── shared/           # Shared validation & schemas
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** before submitting
4. **Follow the style guidelines** below
5. **Link related issues** in the PR description
6. **Request review** from maintainers

### PR Title Format

```
type(scope): description

Examples:
feat(templates): add Playwright Python template
fix(wizard): resolve build tool dropdown issue
docs(readme): update installation instructions
```

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public functions

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper TypeScript types for props

### Git Commits

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep first line under 72 characters

## 🏷️ Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature request |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `documentation` | Documentation improvements |

## ❓ Questions?

Feel free to open an issue with the `question` label or reach out:

- Twitter/X: [@qatonicinnovate](https://x.com/qatonicinnovate)
- LinkedIn: [QATonic](https://www.linkedin.com/company/qatonic)

---

Thank you for contributing! 🙏
