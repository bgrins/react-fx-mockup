import React, { useState, useRef, useEffect } from 'react';
import { ComposerPrimitive, useThreadComposer, useComposerRuntime } from '@assistant-ui/react';
import styles from './enhanced-composer.module.css';

interface ToolSuggestion {
  id: string;
  name: string;
  description: string;
  trigger: string;
  icon?: string;
}

const availableTools: ToolSuggestion[] = [
  {
    id: 'shopping',
    name: 'Shopping',
    description: 'Find and browse shoes and footwear',
    trigger: '@shopping',
    icon: '🛍️'
  },
  {
    id: 'trip',
    name: 'Trip Planning', 
    description: 'Plan your travel and vacations',
    trigger: '@trip',
    icon: '✈️'
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Configure your preferences',
    trigger: '@settings',
    icon: '⚙️'
  },
  {
    id: 'tabs',
    name: 'Browser Tabs',
    description: 'Manage your browser tabs',
    trigger: '@tabs',
    icon: '📑'
  },
  {
    id: 'url',
    name: 'Open URL',
    description: 'Navigate to a specific URL (@url:example.com)',
    trigger: '@url:',
    icon: '🌐'
  }
];

interface EnhancedComposerProps {
  placeholder?: string;
  onToolSelect?: (tool: ToolSuggestion) => void;
}

export const EnhancedComposer: React.FC<EnhancedComposerProps> = ({
  placeholder = "Send a message...",
  onToolSelect
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTools, setFilteredTools] = useState<ToolSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const composer = useThreadComposer();
  const composerRuntime = useComposerRuntime();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Find @ mentions
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const mentionPart = textBeforeCursor.substring(atIndex);
      const hasSpace = mentionPart.includes(' ');
      
      if (!hasSpace) {
        const searchTerm = mentionPart.substring(1).toLowerCase();
        const filtered = availableTools.filter(tool => 
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.trigger.toLowerCase().includes(mentionPart.toLowerCase())
        );
        setFilteredTools(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredTools.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredTools.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (filteredTools[selectedIndex]) {
          e.preventDefault();
          handleToolSelection(filteredTools[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleToolSelection = (tool: ToolSuggestion) => {
    const currentText = composer.text;
    
    // Find the @ symbol position
    const atIndex = currentText.lastIndexOf('@');
    
    if (atIndex !== -1) {
      // For @url, don't add a space after the colon
      const suffix = tool.id === 'url' ? '' : ' ';
      const newText = 
        currentText.substring(0, atIndex) + 
        tool.trigger + suffix;
      
      // Use the composer runtime to update the text
      composerRuntime.setText(newText);
    }

    setShowSuggestions(false);
    onToolSelect?.(tool);
  };

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      <ComposerPrimitive.Input
        ref={inputRef}
        placeholder={placeholder}
        className={styles.input}
        rows={1}
        autoFocus
        aria-label="Message input"
        autoComplete="off"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className={styles.suggestionsDropdown}
        >
          <div className={styles.suggestionsContent}>
            <div className={styles.suggestionsHeader}>Tools</div>
            {filteredTools.map((tool, index) => (
              <button
                key={tool.id}
                className={`${styles.toolOption} ${
                  index === selectedIndex ? styles.toolOptionSelected : ''
                }`}
                onClick={() => handleToolSelection(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={styles.toolOptionContent}>
                  <span className={styles.toolIcon}>{tool.icon}</span>
                  <div className={styles.toolDetails}>
                    <div className={styles.toolName}>{tool.name}</div>
                    <div className={styles.toolDescription}>
                      {tool.description}
                    </div>
                    <div className={styles.toolTrigger}>
                      {tool.trigger}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};