import React from "react";
import { cn } from "~/lib/utils";
import { streamText } from "ai";
import { createInferClient } from "~/lib/infer-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pageContent?: string;
  pageTitle?: string;
  pageUrl?: string;
  accessKey?: string;
}

type SidebarSection = "pageInfo" | "bookmarks" | "history" | "synced" | null;

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
  pageContent,
  pageTitle,
  pageUrl,
  accessKey,
}: SidebarProps) {
  const [activeSection, setActiveSection] = React.useState<SidebarSection>(null);
  const [previousSection, setPreviousSection] = React.useState<SidebarSection>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [width, setWidth] = React.useState(360);
  const [isResizing, setIsResizing] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  // Auto-focus input when page info section opens
  React.useEffect(() => {
    if (activeSection === "pageInfo" && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeSection]);

  // Handle sidebar open/close - restore previous section when reopening
  React.useEffect(() => {
    if (isOpen && previousSection && !activeSection) {
      // When opening, restore the previous section
      setActiveSection(previousSection);
      setPreviousSection(null);
    } else if (!isOpen && activeSection) {
      // When closing, save the current section and clear it
      setPreviousSection(activeSection);
      setActiveSection(null);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !accessKey) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const contentString = typeof pageContent === 'string' ? pageContent : '';
      const context = contentString
        ? `Current page: ${pageTitle || "Unknown"} (${pageUrl || "Unknown URL"})
           
           Page content:
           ${contentString.substring(0, 3000)}...`
        : "No page content available.";

      const infer = createInferClient(accessKey);
      
      const assistantMessage: Message = {
        id: `msg-assistant-${Date.now()}-${Math.random()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const { textStream } = await streamText({
        model: infer("gpt-4o-mini"),
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that can answer questions about the current webpage. ${context}`,
          },
          ...messages.map((msg) => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
          })),
          {
            role: "user",
            content: input,
          },
        ],
        temperature: 0.7,
      });

      let fullContent = "";
      for await (const chunk of textStream) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullContent }
              : msg
          )
        );
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorDetails = error?.message || "Unknown error";
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorDetails}. Please check your API key and try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    // Don't update width here - just start resizing from current width state
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Get the parent sidebar container position
      const sidebarContainer = sidebarRef.current?.parentElement;
      if (!sidebarContainer) return;
      
      const containerRect = sidebarContainer.getBoundingClientRect();
      const iconStripWidth = 48; // Width of the icon strip
      
      // Calculate new width from the left edge of the content area (after icon strip)
      const newWidth = e.clientX - containerRect.left - iconStripWidth;
      
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
    } else {
      setActiveSection(section);
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3">
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

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex flex-col gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this page..."
                  disabled={!accessKey || isLoading}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!accessKey || isLoading || !input.trim()}
                  className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Send
                </button>
              </div>
            </div>
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
      
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex h-full bg-[#f9f9fb]",
      !isResizing && "transition-all duration-200 ease-in-out",
      !isOpen && "w-0 overflow-hidden"
    )}>
      {/* Icon strip */}
      <div className={cn(
        "w-12 flex flex-col bg-[#f0f0f4]",
        !isResizing && "transition-all duration-200 ease-in-out",
        !isOpen && "w-0 overflow-hidden"
      )}>
        <div className="flex-1 flex flex-col py-2">
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
          onClick={onClose}
          className="w-full h-10 flex items-center justify-center hover:bg-[#e0e0e4] transition-colors"
          aria-label="Close sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 8H12M4 8L7 5M4 8L7 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content area */}
      <div
        ref={sidebarRef}
        className={cn(
          "relative bg-[#f9f9fb] flex-shrink-0",
          !isResizing && "transition-all duration-200 ease-in-out",
          !activeSection && "w-0 overflow-hidden"
        )}
        style={{ width: activeSection ? `${width}px` : '0px' }}
      >
        <div className="flex flex-col h-full bg-white">
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