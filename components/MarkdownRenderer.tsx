'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize heading styles
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-foreground mb-2 mt-2 first:mt-0">
              {children}
            </h3>
          ),
          // Customize paragraph styles
          p: ({ children }) => (
            <p className="text-sm text-muted-foreground mb-2 last:mb-0">
              {children}
            </p>
          ),
          // Customize list styles
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm text-muted-foreground mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-muted-foreground">
              {children}
            </li>
          ),
          // Customize strong/bold text
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          // Customize emphasis/italic text
          em: ({ children }) => (
            <em className="italic text-muted-foreground">
              {children}
            </em>
          ),
          // Customize code blocks
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('block bg-muted p-2 rounded text-xs font-mono text-foreground overflow-x-auto', className)}>
                {children}
              </code>
            )
          },
          // Customize blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground mb-2">
              {children}
            </blockquote>
          ),
          // Customize horizontal rules
          hr: () => (
            <hr className="border-muted-foreground/20 my-4" />
          ),
          // Customize links
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary hover:text-primary/80 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Customize tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border-collapse border border-muted-foreground/20">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-muted-foreground/20 px-2 py-1 bg-muted/50 text-left text-xs font-medium text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-muted-foreground/20 px-2 py-1 text-xs text-muted-foreground">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
