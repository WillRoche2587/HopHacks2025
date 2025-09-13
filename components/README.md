# Components

## MarkdownRenderer

A React component for rendering markdown content with custom styling that matches the application's design system.

### Features

- **Custom Styling**: All markdown elements are styled to match the application's theme
- **Responsive Design**: Works well on all screen sizes
- **Accessibility**: Proper semantic HTML structure
- **GitHub Flavored Markdown**: Supports tables, strikethrough, task lists, etc.

### Usage

```tsx
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

<MarkdownRenderer 
  content="# Hello World\n\nThis is **bold** text with a [link](https://example.com)"
  className="text-sm"
/>
```

### Supported Markdown Elements

- Headers (H1-H6)
- Paragraphs
- Lists (ordered and unordered)
- Bold and italic text
- Code blocks and inline code
- Blockquotes
- Links
- Tables
- Horizontal rules

### Styling

The component uses Tailwind CSS classes and follows the application's design system:
- Headers use the Space Grotesk font family
- Text colors follow the theme (foreground, muted-foreground)
- Proper spacing and typography hierarchy
- Responsive design patterns
