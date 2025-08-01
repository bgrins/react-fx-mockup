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

export function Sidebar({
  isOpen,
  onClose,
  pageContent,
  pageTitle,
  pageUrl,
  accessKey,
}: SidebarProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [width, setWidth] = React.useState(320);
  const [isResizing, setIsResizing] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
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
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-width", width.toString());
    }
  }, [width]);

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
      console.log("Sending message with accessKey:", accessKey ? "present" : "missing");
      console.log("Page content type:", typeof pageContent, pageContent);
      
      // Prepare the context about the current page
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX - (sidebarRef.current?.getBoundingClientRect().left || 0);
      if (newWidth >= 200 && newWidth <= 600) {
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

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      className="relative h-full bg-[#f9f9fb] border-r border-[#cfcfd8] flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className={cn(
            "font-semibold truncate",
            width < 280 ? "text-base" : "text-lg"
          )}>
            Chat with Page
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
            aria-label="Close sidebar"
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
        <div className={cn(
          "flex-1 overflow-y-auto space-y-3",
          width < 280 ? "p-2" : "p-4"
        )}>
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className={width < 280 ? "text-sm" : ""}>Ask questions about the current page!</p>
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
                  "max-w-[85%] rounded-lg",
                  width < 280 ? "px-2 py-1.5" : "px-3 py-2",
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                )}
              >
                <p className={cn(
                  "whitespace-pre-wrap break-words",
                  width < 280 ? "text-xs" : "text-sm"
                )}>{message.content}</p>
                {width >= 250 && (
                  <p
                    className={cn(
                      "text-xs mt-1",
                      message.role === "user" ? "text-blue-100" : "text-gray-500"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                )}
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
        <div className={cn(
          "border-t",
          width < 280 ? "p-2" : "p-4"
        )}>
          <div className={cn(
            "flex",
            width < 260 ? "flex-col gap-2" : "flex-row gap-2"
          )}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={width < 280 ? "Ask..." : "Ask about this page..."}
              disabled={!accessKey || isLoading}
              className={cn(
                "flex-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100",
                width < 280 ? "px-2 py-1.5 text-sm" : "px-3 py-2"
              )}
            />
            <button
              onClick={sendMessage}
              disabled={!accessKey || isLoading || !input.trim()}
              className={cn(
                "bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium",
                width < 280 ? "px-3 py-1.5 text-sm" : "px-4 py-2",
                width < 260 ? "w-full" : ""
              )}
            >
              {width < 280 ? "Send" : "Send"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Resize handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors",
          isResizing && "bg-blue-500"
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}