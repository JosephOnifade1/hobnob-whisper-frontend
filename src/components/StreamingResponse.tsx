import React, { useState, useEffect } from 'react';

interface StreamingResponseProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

const StreamingResponse: React.FC<StreamingResponseProps> = ({
  content,
  isStreaming = false,
  className = ''
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStreaming && currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, 30); // Adjust speed as needed

      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      setDisplayedContent(content);
      setCurrentIndex(content.length);
    }
  }, [content, currentIndex, isStreaming]);

  return (
    <div className={className}>
      <span>{displayedContent}</span>
      {isStreaming && currentIndex < content.length && (
        <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse" />
      )}
    </div>
  );
};

export default StreamingResponse;