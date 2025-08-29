import React from 'react';

interface MarkdownViewerProps {
  content: string;
}

// Very basic markdown to JSX parser
const parseMarkdown = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-4 pl-4">{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  };
  
  const flushCodeBlock = () => {
    if (inCodeBlock) {
      elements.push(
        <pre key={`pre-${elements.length}`} className="bg-bunker-100 dark:bg-bunker-900 p-4 rounded-md my-4 overflow-x-auto">
          <code className="font-mono text-sm text-bunker-800 dark:text-bunker-200">
            {codeBlockContent.join('\n')}
          </code>
        </pre>
      );
      codeBlockContent = [];
      inCodeBlock = false;
    }
  };

  const parseInline = (line: string): React.ReactNode => {
    // Bold, Italic, Inline Code
    const parts = line.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') || part.startsWith('__') && part.endsWith('__')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') || part.startsWith('_') && part.endsWith('_')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-bunker-200 dark:bg-bunker-700 rounded px-1 py-0.5 font-mono text-sm">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    // Code blocks ```
    if (line.trim() === '```') {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={index} className="text-3xl font-bold mt-6 mb-3 border-b border-bunker-200 dark:border-bunker-700 pb-2">{parseInline(line.substring(2))}</h1>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="text-2xl font-bold mt-5 mb-2">{parseInline(line.substring(3))}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="text-xl font-bold mt-4 mb-1">{parseInline(line.substring(4))}</h3>);
    } 
    // List items
    else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      if (!inList) {
        inList = true;
      }
      listItems.push(<li key={index}>{parseInline(line.trim().substring(2))}</li>);
    }
    // Paragraphs
    else {
      flushList();
      if (line.trim() !== '') {
        elements.push(<p key={index} className="my-3 leading-relaxed">{parseInline(line)}</p>);
      }
    }
  });

  flushList(); // Make sure to flush any remaining list
  flushCodeBlock(); // Make sure to flush any remaining code block

  return elements;
};

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <article className="prose prose-bunker dark:prose-invert max-w-none">
      {parseMarkdown(content)}
    </article>
  );
};
