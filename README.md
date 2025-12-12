# Conversational Symptom Logger

A React-based web application that enables users to log health symptoms through natural conversation powered by Claude AI. The system extracts structured metadata while maintaining a conversational, user-friendly interface.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Dependencies & Attributions](#dependencies--attributions)
- [Architecture](#architecture)
- [Setup](#setup)
- [License](#license)

## Overview

This application provides an intelligent symptom tracking system that:
- Engages users in natural conversation to log symptoms
- Extracts structured metadata (location, onset, severity)
- Groups symptoms into health issues for tracking over time
- Provides historical symptom analysis and visualization

## Technology Stack

### Core Framework & Build Tools

- **React 18.2.0** - UI library
  - Website: https://react.dev/
  - License: MIT
  - Used for: Component-based UI architecture

- **TypeScript 5.2.2** - Type-safe JavaScript
  - Website: https://www.typescriptlang.org/
  - License: Apache-2.0
  - Used for: Static typing and enhanced developer experience

- **Vite 5.0.8** - Build tool and dev server
  - Website: https://vitejs.dev/
  - License: MIT
  - Used for: Fast development builds and HMR

### AI & API Integration

- **@anthropic-ai/sdk 0.70.0** - Claude API client
  - Website: https://www.anthropic.com/
  - Documentation: https://docs.anthropic.com/
  - License: MIT
  - Used for: Conversational AI and metadata extraction
  - **Citation**: Claude Sonnet 4 model (claude-sonnet-4-20250514) powers all natural language understanding and structured data extraction

- **Langfuse 3.38.6** - LLM observability platform
  - Website: https://langfuse.com/
  - Documentation: https://langfuse.com/docs
  - License: MIT
  - Used for: Prompt tracking, evaluation, and debugging LLM interactions

### UI Components & Styling

- **Tailwind CSS 3.3.6** - Utility-first CSS framework
  - Website: https://tailwindcss.com/
  - License: MIT
  - Used for: Responsive styling and design system

- **shadcn/ui Components** - Accessible component library built on Radix UI
  - Website: https://ui.shadcn.com/
  - License: MIT
  - Components used:
    - Dialog, Alert, Button, Input, Card, Table, Badge
    - Avatar, Label, Select, Separator, Skeleton, Scroll Area
  - **Note**: shadcn/ui components are copied into the project and customized
  - Based on: Radix UI primitives

- **Radix UI** - Unstyled, accessible component primitives
  - Website: https://www.radix-ui.com/
  - License: MIT
  - Packages used:
    - @radix-ui/react-dialog@1.1.15
    - @radix-ui/react-scroll-area@1.2.10
    - @radix-ui/react-avatar@1.1.11
    - @radix-ui/react-label@2.1.8
    - @radix-ui/react-select@2.2.6
    - @radix-ui/react-separator@1.1.8
    - @radix-ui/react-slot@1.2.4
    - @radix-ui/react-icons@1.3.2

- **Lucide React 0.554.0** - Icon library
  - Website: https://lucide.dev/
  - License: ISC
  - Used for: UI icons (AlertCircle, CheckCircle2, Loader2, etc.)

### Utility Libraries

- **class-variance-authority 0.7.1** (cva) - Component variant management
  - Repository: https://github.com/joe-bell/cva
  - License: Apache-2.0
  - Used for: Type-safe component variant styling

- **clsx 2.1.1** - Class name utility
  - Repository: https://github.com/lukeed/clsx
  - License: MIT
  - Used for: Conditional className composition

- **tailwind-merge 3.4.0** - Tailwind class merging
  - Repository: https://github.com/dcastil/tailwind-merge
  - License: MIT
  - Used for: Intelligent Tailwind class merging without conflicts

### Development Tools

- **ESLint 8.55.0** - JavaScript linter
  - Website: https://eslint.org/
  - License: MIT
  - Used for: Code quality and consistency

- **@vitejs/plugin-react 4.2.1** - Vite React plugin
  - License: MIT
  - Used for: React Fast Refresh in Vite

- **PostCSS 8.4.32** & **Autoprefixer 10.4.16**
  - License: MIT
  - Used for: CSS processing and vendor prefixing

## Dependencies & Attributions

### Runtime Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.70.0",
  "@radix-ui/react-avatar": "^1.1.11",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-icons": "^1.3.2",
  "@radix-ui/react-label": "^2.1.8",
  "@radix-ui/react-scroll-area": "^1.2.10",
  "@radix-ui/react-select": "^2.2.6",
  "@radix-ui/react-separator": "^1.1.8",
  "@radix-ui/react-slot": "^1.2.4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "langfuse": "^3.38.6",
  "lucide-react": "^0.554.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tailwind-merge": "^3.4.0"
}
```

### Development Dependencies

```json
{
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@typescript-eslint/eslint-plugin": "^6.14.0",
  "@typescript-eslint/parser": "^6.14.0",
  "@vitejs/plugin-react": "^4.2.1",
  "autoprefixer": "^10.4.16",
  "eslint": "^8.55.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.5",
  "postcss": "^8.4.32",
  "tailwindcss": "^3.3.6",
  "typescript": "^5.2.2",
  "vite": "^5.0.8"
}
```

## Architecture

### File Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── ChatInput.tsx   # Message input component
│   ├── Message.tsx     # Chat message display
│   ├── SymptomTable.tsx
│   ├── IssueTable.tsx
│   └── ...
├── utils/              # Utility functions
│   ├── uuid.ts         # UUID generation
│   └── dateHelpers.ts  # Date utilities
├── App.tsx             # Main application
├── ChatInterface.tsx   # Conversational UI
├── claudeService.ts    # Claude API integration
├── langfuse.ts         # Observability integration
├── localStorage.ts     # Data persistence
├── promptTemplates.ts  # AI prompts
├── toolHandlers.ts     # Claude tool execution
├── types.ts            # TypeScript definitions
├── validators.ts       # Data validation
└── main.tsx           # Application entry point
```

### Key Design Patterns

1. **Conversational Data Extraction**: Uses Claude's conversational AI to naturally extract structured symptom data through multi-turn dialogue

2. **Tool Use Pattern**: Implements Claude's tool_use API for symptom history retrieval

3. **Draft Autosave**: Automatically saves conversation state to localStorage with 24-hour expiration

4. **Issue Grouping**: AI-powered symptom grouping into health issues for longitudinal tracking

5. **Observability**: Langfuse integration for prompt tracking and LLM evaluation

## Codeleveraged & Attributions

### shadcn/ui Components

The following UI components were sourced from shadcn/ui and customized for this project:

- **Location**: `src/components/ui/`
- **Source**: https://ui.shadcn.com/
- **License**: MIT
- **Modifications**: Customized styling and added project-specific variants

Components used:
- `alert.tsx` - Alert notifications
- `avatar.tsx` - User avatars
- `badge.tsx` - Status badges
- `button.tsx` - Interactive buttons
- `card.tsx` - Content cards
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `scroll-area.tsx` - Scrollable containers
- `select.tsx` - Dropdown selects
- `separator.tsx` - Visual dividers
- `skeleton.tsx` - Loading placeholders
- `table.tsx` - Data tables

### Utility Functions

- **`src/lib/utils.ts`** - Utility helper from shadcn/ui
  - Source: https://ui.shadcn.com/docs/installation/manual
  - Function: `cn()` for className merging
  - License: MIT

### Prompt Engineering

- **`src/promptTemplates.ts`** - Custom prompt templates
  - Based on Anthropic's prompt engineering guide
  - Documentation: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering

### Data Persistence

- **Browser localStorage API** - Used for client-side data persistence
  - MDN Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
  - Standard Web API

## Setup

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key (https://console.anthropic.com/)
- (Optional) Langfuse account for observability (https://langfuse.com/)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   VITE_LANGFUSE_PUBLIC_KEY=your_langfuse_public_key (optional)
   VITE_LANGFUSE_SECRET_KEY=your_langfuse_secret_key (optional)
   VITE_LANGFUSE_HOST=https://cloud.langfuse.com (optional)
   VITE_ENVIRONMENT=development
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## License

This project is for educational purposes. All dependencies maintain their original licenses:

- **React, Vite, Tailwind CSS**: MIT License
- **Anthropic SDK**: MIT License
- **Radix UI**: MIT License
- **shadcn/ui**: MIT License (components copied and customized)
- **Lucide Icons**: ISC License
- **Langfuse**: MIT License