import React from "react";
import { cn } from "~/lib/utils";
import { MegaChat } from '../assistant-ui/mega-chat';


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  accessKey?: string;
  defaultSection?: SidebarSection;
  onSidebarToggle?: () => void;
  smartWindowMode?: boolean;
  isExpanded?: boolean; // For Smart Window mode: narrow vs expanded
  isFirefoxViewActive?: boolean; // Whether Firefox View is the active tab
}

type SidebarSection = "pageInfo" | "bookmarks" | "history" | "synced" | "settings" | null;

const sectionIcons = {
  pageInfo: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 7V11M8 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  bookmarks: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 2V14L8 10.5L13 14V2H3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  synced: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13 8C13 10.7614 10.7614 13 8 13C6.41775 13 5.0037 12.2822 4.05025 11.1707M3 8C3 5.23858 5.23858 3 8 3C9.58225 3 10.9963 3.71776 11.9497 4.82929"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M11 2V5H14M5 14V11H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Sidebar({
  isOpen,
  onClose,
  accessKey,
  defaultSection = "pageInfo",
  onSidebarToggle,
  smartWindowMode = false,
  isExpanded = false,
  isFirefoxViewActive = false,
}: SidebarProps) {
  const [activeSection, setActiveSection] = React.useState<SidebarSection>(null);
  const [previousSection, setPreviousSection] = React.useState<SidebarSection>(null);
  const [width, setWidth] = React.useState(360);
  const [isResizing, setIsResizing] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("sidebar-width");
      if (savedWidth) {
        setWidth(parseInt(savedWidth, 10));
      }
    }
  }, []);

  // Save width to localStorage when it changes
  React.useEffect(() => {
    if (typeof window !== "undefined" && activeSection !== null) {
      localStorage.setItem("sidebar-width", width.toString());
    }
  }, [width, activeSection]);


  // Handle sidebar open/close - restore previous section when reopening
  React.useEffect(() => {
    // In Smart Window mode, use isExpanded instead of isOpen
    const shouldExpand = smartWindowMode ? isExpanded : isOpen;
    
    if (shouldExpand && !activeSection) {
      // When expanding/opening, restore the previous section or use default
      if (previousSection) {
        setActiveSection(previousSection);
        setPreviousSection(null);
      } else {
        // Use default section when expanding/opening for the first time
        setActiveSection(defaultSection);
      }
    } else if (!shouldExpand && activeSection) {
      // When collapsing/closing, save the current section and clear it
      setPreviousSection(activeSection);
      setActiveSection(null);
    }
  }, [isOpen, isExpanded, smartWindowMode, defaultSection]);



  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    // Don't update width here - just start resizing from current width state
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Get the entire sidebar component position
      const sidebarComponent = sidebarRef.current?.closest('.flex.h-full.bg-\\[\\#f9f9fb\\]');
      if (!sidebarComponent) return;
      
      const componentRect = sidebarComponent.getBoundingClientRect();
      const iconStripWidth = 48; // Width of the icon strip
      
      // Calculate new width from mouse position relative to the sidebar component left edge minus icon strip
      const newWidth = e.clientX - componentRect.left - iconStripWidth;
      
      if (newWidth >= 280 && newWidth <= 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSectionClick = (section: SidebarSection) => {
    if (activeSection === section) {
      setActiveSection(null);
      // In Smart Window mode, also collapse the sidebar when closing a section
      if (smartWindowMode && onSidebarToggle) {
        onSidebarToggle();
      }
    } else {
      setActiveSection(section);
      // In Smart Window mode, expand the sidebar when opening a section
      if (smartWindowMode && onSidebarToggle && !isExpanded) {
        onSidebarToggle();
      }
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "pageInfo":
        return (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold text-lg truncate">
                Page Info
              </h2>
              <button
                onClick={() => setActiveSection(null)}
                className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                aria-label="Close section"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-[93%]">
              <MegaChat accessKey={accessKey ? accessKey : ''} />
            </div>


            {/* Messages */}
            {/* <div className="flex-1 overflow-y-auto space-y-3 p-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-sm">Ask questions about the current page!</p>
                  {!accessKey && (
                    <p className="text-xs text-red-500 mt-2">
                      Please set your API key in settings (Alt+?)
                    </p>
                  )}
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2",
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.role === "user" ? "text-blue-100" : "text-gray-500"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}


              <div ref={messagesEndRef} />
            </div> */}

            {/* Input */}
            {/* <div className="border-t p-3">
              <div className="flex flex-col gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this page..."
                  disabled={!accessKey}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!accessKey || !input.trim()}
                  className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Send
                </button>
              </div>
            </div> */}
          </>
        );
      
      case "bookmarks":
        return (
          <>
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold text-lg">Bookmarks</h2>
              <button
                onClick={() => setActiveSection(null)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close section"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 text-center text-gray-500">
              <p>No bookmarks yet</p>
            </div>
          </>
        );
      
      case "history":
        return (
          <>
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold text-lg">History</h2>
              <button
                onClick={() => setActiveSection(null)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close section"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 text-center text-gray-500">
              <p>No history available</p>
            </div>
          </>
        );
      
      case "synced":
        return (
          <>
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold text-lg">Synced Tabs</h2>
              <button
                onClick={() => setActiveSection(null)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close section"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 text-center text-gray-500">
              <p>No synced tabs</p>
            </div>
          </>
        );
      
      case "settings":
        return (
          <>
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold text-lg">Settings</h2>
              <button
                onClick={() => setActiveSection(null)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close section"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Sidebar Width</h3>
                <p className="text-sm text-gray-600">Current width: {width}px</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Quick Actions</h3>
                <button
                  onClick={onClose}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Close Sidebar
                </button>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // In Smart Window mode, always show sidebar (narrow or expanded)
  // In classic mode, use traditional open/closed behavior
  const shouldShow = smartWindowMode || isOpen;
  const backgroundClass = smartWindowMode ? "bg-white/20 backdrop-blur-md border-r border-white/10" : "bg-[#f9f9fb]";

  return (
    <div className={cn(
      "flex h-full",
      backgroundClass,
      !isResizing && "transition-all duration-200 ease-in-out",
      !shouldShow && "w-0 overflow-hidden"
    )}>
      {/* Icon strip */}
      <div className={cn(
        "w-12 flex flex-col",
        !isResizing && "transition-all duration-200 ease-in-out",
        !shouldShow && "w-0 overflow-hidden"
      )}>
        <div className="flex-1 flex flex-col py-2">
          {/* Sidebar toggle button at the top - only in Smart Window mode + Firefox View */}
          {onSidebarToggle && smartWindowMode && isFirefoxViewActive && (
            <button
              onClick={onSidebarToggle}
              className="w-full h-10 flex items-center justify-center hover:bg-[#e0e0e4] transition-colors"
              title="Sidebar"
            >
              <span className="text-[#0c0c0d]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2 2C0.895786 2 0 2.89579 0 4V12C0 13.1042 0.895786 14 2 14H14C15.1042 14 16 13.1042 16 12V4C16 2.89579 15.1042 2 14 2H2ZM4 12.5H14C14.2758 12.5 14.5 12.2758 14.5 12V4C14.5 3.72421 14.2758 3.5 14 3.5H4V12.5Z" fill="#5B5B66"/>
                </svg>
              </span>
            </button>
          )}
          
          {(Object.keys(sectionIcons) as Array<keyof typeof sectionIcons>).map((section) => (
            <button
              key={section}
              onClick={() => handleSectionClick(section)}
              className={cn(
                "w-full h-10 flex items-center justify-center hover:bg-[#e0e0e4] transition-colors",
                activeSection === section && "bg-[#dadae0]"
              )}
              title={section === "pageInfo" ? "Page Info" : section.charAt(0).toUpperCase() + section.slice(1)}
            >
              <span className="text-[#0c0c0d]">{sectionIcons[section]}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => handleSectionClick("settings")}
          className={cn(
            "w-full h-10 flex items-center justify-center hover:bg-[#e0e0e4] transition-colors",
            activeSection === "settings" && "bg-[#dadae0]"
          )}
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M13.5 8C13.5 8.3 13.48 8.59 13.45 8.88L14.94 10.07C15.08 10.18 15.12 10.38 15.04 10.55L13.64 12.95C13.55 13.11 13.36 13.17 13.19 13.11L11.43 12.38C11.05 12.67 10.63 12.9 10.17 13.05L9.9 14.94C9.87 15.12 9.71 15.25 9.52 15.25H6.72C6.53 15.25 6.37 15.12 6.35 14.94L6.08 13.05C5.62 12.9 5.2 12.66 4.82 12.38L3.06 13.11C2.89 13.17 2.7 13.11 2.61 12.95L1.21 10.55C1.12 10.39 1.17 10.19 1.31 10.07L2.8 8.88C2.77 8.59 2.75 8.3 2.75 8C2.75 7.7 2.77 7.41 2.8 7.12L1.31 5.93C1.17 5.82 1.13 5.62 1.21 5.45L2.61 3.05C2.7 2.89 2.89 2.83 3.06 2.89L4.82 3.62C5.2 3.33 5.62 3.1 6.08 2.95L6.35 1.06C6.37 0.88 6.53 0.75 6.72 0.75H9.52C9.71 0.75 9.87 0.88 9.89 1.06L10.16 2.95C10.62 3.1 11.04 3.34 11.42 3.62L13.18 2.89C13.35 2.83 13.54 2.89 13.63 3.05L15.03 5.45C15.12 5.61 15.07 5.81 14.93 5.93L13.44 7.12C13.47 7.41 13.49 7.7 13.49 8L13.5 8Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      {/* Content area */}
      <div
        ref={sidebarRef}
        className={cn(
          "relative flex-shrink-0",
          smartWindowMode ? "bg-white/10 backdrop-blur-lg border-r border-white/5" : "bg-[#f9f9fb]",
          !isResizing && "transition-all duration-200 ease-in-out",
          // In Smart Window mode: show content only when expanded
          // In classic mode: show content when activeSection exists
          smartWindowMode ? (!isExpanded && "w-0 overflow-hidden") : (!activeSection && "w-0 overflow-hidden")
        )}
        style={{ 
          width: smartWindowMode 
            ? (isExpanded ? `${width}px` : '0px')
            : (activeSection ? `${width}px` : '0px')
        }}
      >
        <div className="flex flex-col h-full">
          {renderSectionContent()}
        </div>
        
        {/* Resize handle */}
        {activeSection && (
          <div
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors",
              isResizing && "bg-blue-500"
            )}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </div>
  );
}