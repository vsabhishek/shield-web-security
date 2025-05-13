
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type CyberTerminalProps = {
  content: string | string[];
  className?: string;
  typing?: boolean;
  typingSpeed?: number;
};

const CyberTerminal = ({
  content,
  className,
  typing = false,
  typingSpeed = 20,
}: CyberTerminalProps) => {
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Convert content to string if it's an array
  const textContent = Array.isArray(content) ? content.join('\n') : content;
  
  useEffect(() => {
    if (!typing) {
      setDisplayedContent(textContent);
      return;
    }
    
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex < textContent.length) {
        setDisplayedContent(prev => prev + textContent.charAt(currentIndex));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, typingSpeed);
    
    return () => clearInterval(timer);
  }, [textContent, typing, typingSpeed]);
  
  useEffect(() => {
    // Auto-scroll to bottom when content changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedContent]);
  
  return (
    <div 
      ref={terminalRef} 
      className={cn(
        'cyber-terminal',
        className
      )}
    >
      <pre className="whitespace-pre-wrap break-words">
        {displayedContent}
        {typing && displayedContent.length < textContent.length && (
          <span className="terminal-cursor"></span>
        )}
      </pre>
    </div>
  );
};

export default CyberTerminal;
