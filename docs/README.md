# Gifts Guru AI - Complete Documentation

This folder contains all developer documentation for Gifts Guru AI, an intelligent gift recommendation system with AI-powered search, faceted filtering, and responsive design.

## 🚀 Quick Start

1. **Setup**: [setup.md](setup.md) - Installation and development environment
2. **Environment Variables**: [env.md](env.md) - Required configuration
3. **Architecture**: [architecture.md](architecture.md) - System overview and design patterns

## 📚 Core Documentation

### System Architecture
- **Architecture Overview**: [architecture.md](architecture.md) - Full system design, data flow, and component relationships
- **API Reference**: [api.md](api.md) - Complete REST API documentation with examples
- **Data Models**: [data-models.md](data-models.md) - Database schemas and type definitions

### Features & Components
- **Faceted Search System**: [search.md](search.md) - AI-powered search with Algolia integration
- **Nested Navigation**: [navigation.md](navigation.md) - Hierarchical menus with Supabase management
- **UI Configuration**: [ui.md](ui.md) - Product card aspects, responsive design patterns

### Development & Operations
- **Security**: [security.md](security.md) - Authentication, authorization, and best practices
- **Performance**: [performance.md](performance.md) - Optimization strategies and monitoring
- **Testing & CI**: [testing-ci.md](testing-ci.md) - Test suite and continuous integration
- **Deployment**: [deployment.md](deployment.md) - Netlify & Vercel deployment guides

### Project Management
- **Troubleshooting**: [troubleshooting.md](troubleshooting.md) - Common issues and solutions
- **Contributing**: [contributing.md](contributing.md) - Development workflow and guidelines
- **Roadmap**: [roadmap.md](roadmap.md) - Future features and improvements
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) - Version history and release notes

### Service Setup
- **Services Configuration**: [SETUP_SERVICES.md](SETUP_SERVICES.md) - External service integration
- **Task Board**: [task_board.md](task_board.md) - Development tracking and progress

## 🎯 Key Features

### 🤖 AI-Powered Gift Search
- Natural language query processing with OpenAI
- Intelligent intent parsing and filter extraction
- Context-aware product recommendations
- Multi-modal search with text and structured filters

### 🔍 Advanced Faceted Search
- Real-time facet counts with Algolia integration
- Dual-mode filtering (strict and soft)
- Zero-hit fallback with automatic result broadening
- Interactive filter chips with live state management

### 🧭 Hierarchical Navigation
- Nested dropdown menus for desktop
- Mobile-friendly accordion navigation
- Supabase-managed navigation structure
- Full accessibility support with ARIA attributes

### 📱 Responsive Design
- Full-width chat interface for immersive experience
- Configurable product image aspects (square/portrait)
- Mobile-first design with optimized breakpoints
- Performance-optimized with zero layout shift

### 🌐 Modern Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: Express.js, Node.js, Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Search**: Algolia with faceted search
- **AI**: OpenAI GPT for intent parsing
- **Deployment**: Netlify Functions, Vercel Preview

## 📈 Performance Highlights

- **Sub-200ms** search latency with Algolia
- **Intent token caching** for pagination optimization
- **CSS-only aspect ratios** with no runtime overhead
- **Comprehensive telemetry** for analytics and monitoring
- **Progressive enhancement** with accessibility-first design

## 🔧 Development Workflow

1. **Feature Development**: Branch-based workflow with feature flags
2. **Code Quality**: TypeScript strict mode, ESLint, Prettier
3. **Testing**: Component tests, API tests, E2E testing
4. **Deployment**: Automated builds with Vercel previews
5. **Monitoring**: Real-time error tracking and performance metrics

## 📖 Getting Started

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd gmAISearch
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your service keys

# 3. Start development server
pnpm dev

# 4. View documentation
open http://localhost:5173
```

## 🤝 Contributing

See [contributing.md](contributing.md) for detailed guidelines on:
- Code style and conventions
- Pull request process
- Issue reporting
- Feature requests

## 📞 Support

- **Documentation Issues**: File an issue in the repository
- **Feature Requests**: Use the roadmap discussion
- **Bug Reports**: Include reproduction steps and environment details
