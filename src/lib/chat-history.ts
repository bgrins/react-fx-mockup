export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model?: string;
  estimatedCost?: number; // in USD cents
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  tokenUsage?: TokenUsage;
  responseTime?: number; // in milliseconds
  toolCalls?: Array<{
    toolName: string;
    args: any;
    result?: any;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  totalTokens: number;
  totalCost: number; // in USD cents
  messageCount: number;
  averageResponseTime?: number;
  tags?: string[];
}

export interface TokenStats {
  totalChats: number;
  totalMessages: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number; // in USD cents
  averageTokensPerChat: number;
  averageTokensPerMessage: number;
  todayTokens: number;
  yesterdayTokens: number;
  thisWeekTokens: number;
  lastWeekTokens: number;
  thisMonthTokens: number;
  lastMonthTokens: number;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    messages: number;
    cost: number;
  }>;
  modelUsage: Record<
    string,
    {
      tokens: number;
      messages: number;
      cost: number;
    }
  >;
}

export interface ChatHistoryFilters {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  minTokens?: number;
  maxTokens?: number;
  searchQuery?: string;
  tags?: string[];
  sortBy?: "date" | "tokens" | "messages" | "cost";
  sortOrder?: "asc" | "desc";
}

class ChatHistoryManager {
  private readonly STORAGE_KEY = "assistant-ui-chat-history";
  private readonly CURRENT_SESSION_KEY = "assistant-ui-current-session";
  private readonly STATS_CACHE_KEY = "assistant-ui-stats-cache";
  private readonly MAX_SESSIONS = 100;

  // In-memory cache for performance
  private sessionsCache: ChatSession[] | null = null;
  private currentSessionCache: ChatSession | null = null;
  private statsCache: TokenStats | null = null;
  private lastCacheTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Token pricing (approximate costs in USD cents per 1K tokens)
  private readonly TOKEN_PRICING: Record<string, { prompt: number; completion: number }> = {
    "gpt-4o-mini": { prompt: 0.015, completion: 0.06 }, // $0.00015/$0.0006 per 1K tokens
    "gpt-4o": { prompt: 2.5, completion: 10 }, // $0.025/$0.10 per 1K tokens
    "gpt-4": { prompt: 3, completion: 6 }, // $0.03/$0.06 per 1K tokens
    "gpt-3.5-turbo": { prompt: 0.05, completion: 0.15 }, // $0.0005/$0.0015 per 1K tokens
  };

  private calculateTokenCost(usage: TokenUsage): number {
    const model = usage.model || "gpt-4o-mini";
    const pricing = this.TOKEN_PRICING[model] || this.TOKEN_PRICING["gpt-4o-mini"];

    if (!pricing) {
      console.warn(`No pricing found for model: ${model}, using gpt-4o-mini pricing`);
      const fallbackPricing = this.TOKEN_PRICING["gpt-4o-mini"];
      if (!fallbackPricing) {
        // Emergency fallback to default pricing
        return (usage.promptTokens / 1000) * 0.015 + (usage.completionTokens / 1000) * 0.06;
      }
      const promptCost = (usage.promptTokens / 1000) * fallbackPricing.prompt;
      const completionCost = (usage.completionTokens / 1000) * fallbackPricing.completion;
      return promptCost + completionCost;
    }

    const promptCost = (usage.promptTokens / 1000) * pricing.prompt;
    const completionCost = (usage.completionTokens / 1000) * pricing.completion;

    return promptCost + completionCost;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheTime < this.CACHE_DURATION;
  }

  private invalidateCache(): void {
    this.sessionsCache = null;
    this.currentSessionCache = null;
    this.statsCache = null;
    this.lastCacheTime = 0;
  }

  private getCurrentSession(): ChatSession | null {
    if (this.currentSessionCache && this.isCacheValid()) {
      return this.currentSessionCache;
    }

    try {
      const sessionData = localStorage.getItem(this.CURRENT_SESSION_KEY);
      const session = sessionData ? JSON.parse(sessionData) : null;
      this.currentSessionCache = session;
      return session;
    } catch {
      return null;
    }
  }

  private saveCurrentSession(session: ChatSession): void {
    try {
      localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(session));
      this.currentSessionCache = session;
      this.invalidateCache(); // Invalidate cache when data changes
    } catch (error) {
      console.error("Failed to save current session:", error);
    }
  }

  private getAllSessions(): ChatSession[] {
    if (this.sessionsCache && this.isCacheValid()) {
      return this.sessionsCache;
    }

    try {
      const historyData = localStorage.getItem(this.STORAGE_KEY);
      const sessions = historyData ? JSON.parse(historyData) : [];
      this.sessionsCache = sessions;
      this.lastCacheTime = Date.now();
      return sessions;
    } catch {
      return [];
    }
  }

  private saveAllSessions(sessions: ChatSession[]): void {
    try {
      // Keep only the most recent sessions within limit
      const limitedSessions = sessions
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, this.MAX_SESSIONS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedSessions));
      this.sessionsCache = limitedSessions;
      this.lastCacheTime = Date.now();
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }

  public createNewSession(title?: string): ChatSession {
    const session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || `Chat ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTokens: 0,
      totalCost: 0,
      messageCount: 0,
      tags: [],
    };

    this.saveCurrentSession(session);
    return session;
  }

  public addMessage(
    role: "user" | "assistant",
    content: string,
    tokenUsage?: TokenUsage,
    responseTime?: number,
    toolCalls?: Array<{ toolName: string; args: any; result?: any }>,
  ): ChatMessage {
    let currentSession = this.getCurrentSession();

    if (!currentSession) {
      currentSession = this.createNewSession();
    }

    // Calculate cost if token usage is provided
    const cost = tokenUsage ? this.calculateTokenCost(tokenUsage) : 0;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      tokenUsage: tokenUsage ? { ...tokenUsage, estimatedCost: cost } : undefined,
      responseTime,
      toolCalls,
    };

    currentSession.messages.push(message);
    currentSession.updatedAt = Date.now();
    currentSession.messageCount = currentSession.messages.length;

    // Update session title based on first user message
    if (role === "user" && currentSession.messages.filter((m) => m.role === "user").length === 1) {
      const truncatedContent = content.length > 50 ? content.substring(0, 50) + "..." : content;
      currentSession.title = truncatedContent;
    }

    // Update totals
    if (tokenUsage) {
      currentSession.totalTokens += tokenUsage.totalTokens;
      currentSession.totalCost += cost;
    }

    // Calculate average response time
    const responseTimes = currentSession.messages
      .filter((m) => m.responseTime !== undefined)
      .map((m) => m.responseTime!);

    if (responseTimes.length > 0) {
      currentSession.averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    this.saveCurrentSession(currentSession);
    return message;
  }

  public finishSession(): void {
    const currentSession = this.getCurrentSession();
    if (!currentSession || currentSession.messages.length === 0) {
      return;
    }

    const allSessions = this.getAllSessions();
    const existingIndex = allSessions.findIndex((s) => s.id === currentSession.id);

    if (existingIndex >= 0) {
      allSessions[existingIndex] = currentSession;
    } else {
      allSessions.push(currentSession);
    }

    this.saveAllSessions(allSessions);
    localStorage.removeItem(this.CURRENT_SESSION_KEY);
    this.currentSessionCache = null;
  }

  public getAllChatSessions(filters?: ChatHistoryFilters): ChatSession[] {
    let sessions = this.getAllSessions();
    const currentSession = this.getCurrentSession();

    if (currentSession && currentSession.messages.length > 0) {
      const existingIndex = sessions.findIndex((s) => s.id === currentSession.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = currentSession;
      } else {
        sessions = [currentSession, ...sessions];
      }
    }

    // Apply filters
    if (filters) {
      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        const startTime = filters.dateRange.start.getTime();
        const endTime = filters.dateRange.end.getTime();
        sessions = sessions.filter((s) => s.createdAt >= startTime && s.createdAt <= endTime);
      }

      if (filters.minTokens !== undefined) {
        sessions = sessions.filter((s) => s.totalTokens >= filters.minTokens!);
      }

      if (filters.maxTokens !== undefined) {
        sessions = sessions.filter((s) => s.totalTokens <= filters.maxTokens!);
      }

      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        sessions = sessions.filter(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.messages.some((m) => m.content.toLowerCase().includes(query)),
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        sessions = sessions.filter(
          (s) => s.tags && s.tags.some((tag) => filters.tags!.includes(tag)),
        );
      }

      // Sort results
      const sortBy = filters.sortBy || "date";
      const sortOrder = filters.sortOrder || "desc";

      sessions.sort((a, b) => {
        let aVal: number, bVal: number;

        switch (sortBy) {
          case "tokens":
            aVal = a.totalTokens;
            bVal = b.totalTokens;
            break;
          case "messages":
            aVal = a.messageCount;
            bVal = b.messageCount;
            break;
          case "cost":
            aVal = a.totalCost;
            bVal = b.totalCost;
            break;
          default:
            aVal = a.updatedAt;
            bVal = b.updatedAt;
        }

        return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      });
    } else {
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    return sessions;
  }

  public getSession(sessionId: string): ChatSession | null {
    const sessions = this.getAllChatSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  public getTokenStats(): TokenStats {
    if (this.statsCache && this.isCacheValid()) {
      return this.statsCache;
    }

    const sessions = this.getAllChatSessions();
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeekStart = weekAgo - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const lastMonthStart = monthAgo - 30 * 24 * 60 * 60 * 1000;

    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCost = 0;
    let totalMessages = 0;
    let todayTokens = 0;
    let yesterdayTokens = 0;
    let thisWeekTokens = 0;
    let lastWeekTokens = 0;
    let thisMonthTokens = 0;
    let lastMonthTokens = 0;

    const dailyUsageMap = new Map<string, { tokens: number; messages: number; cost: number }>();
    const modelUsageMap = new Map<string, { tokens: number; messages: number; cost: number }>();

    sessions.forEach((session) => {
      session.messages.forEach((message) => {
        totalMessages++;

        if (message.tokenUsage) {
          const tokens = message.tokenUsage.totalTokens;
          const cost = message.tokenUsage.estimatedCost || 0;
          const model = message.tokenUsage.model || "gpt-4o-mini";

          totalTokens += tokens;
          totalPromptTokens += message.tokenUsage.promptTokens;
          totalCompletionTokens += message.tokenUsage.completionTokens;
          totalCost += cost;

          // Time-based tracking
          if (message.timestamp >= today) {
            todayTokens += tokens;
          } else if (message.timestamp >= yesterday && message.timestamp < today) {
            yesterdayTokens += tokens;
          }

          if (message.timestamp >= weekAgo) {
            thisWeekTokens += tokens;
          } else if (message.timestamp >= lastWeekStart && message.timestamp < weekAgo) {
            lastWeekTokens += tokens;
          }

          if (message.timestamp >= monthAgo) {
            thisMonthTokens += tokens;
          } else if (message.timestamp >= lastMonthStart && message.timestamp < monthAgo) {
            lastMonthTokens += tokens;
          }

          // Daily usage tracking
          const dateString = new Date(message.timestamp).toISOString().split("T")[0];
          if (dateString) {
            const existing = dailyUsageMap.get(dateString) || { tokens: 0, messages: 0, cost: 0 };
            dailyUsageMap.set(dateString, {
              tokens: existing.tokens + tokens,
              messages: existing.messages + 1,
              cost: existing.cost + cost,
            });
          }

          // Model usage tracking
          if (model) {
            const modelExisting = modelUsageMap.get(model) || { tokens: 0, messages: 0, cost: 0 };
            modelUsageMap.set(model, {
              tokens: modelExisting.tokens + tokens,
              messages: modelExisting.messages + 1,
              cost: modelExisting.cost + cost,
            });
          }
        }
      });
    });

    // Convert maps to arrays/objects
    const dailyUsage = Array.from(dailyUsageMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const modelUsage = Object.fromEntries(modelUsageMap.entries());

    const stats: TokenStats = {
      totalChats: sessions.length,
      totalMessages,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      totalCost,
      averageTokensPerChat: sessions.length > 0 ? Math.round(totalTokens / sessions.length) : 0,
      averageTokensPerMessage: totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0,
      todayTokens,
      yesterdayTokens,
      thisWeekTokens,
      lastWeekTokens,
      thisMonthTokens,
      lastMonthTokens,
      dailyUsage,
      modelUsage,
    };

    this.statsCache = stats;
    this.lastCacheTime = Date.now();
    return stats;
  }

  public addTagToSession(sessionId: string, tag: string): boolean {
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex >= 0) {
      const session = sessions[sessionIndex];
      if (session) {
        if (!session.tags) {
          session.tags = [];
        }
        if (!session.tags.includes(tag)) {
          session.tags.push(tag);
          this.saveAllSessions(sessions);
          return true;
        }
      }
    }
    return false;
  }

  public removeTagFromSession(sessionId: string, tag: string): boolean {
    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex >= 0) {
      const session = sessions[sessionIndex];
      if (session && session.tags) {
        const tagIndex = session.tags.indexOf(tag);
        if (tagIndex >= 0) {
          session.tags.splice(tagIndex, 1);
          this.saveAllSessions(sessions);
          return true;
        }
      }
    }
    return false;
  }

  public clearAllHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CURRENT_SESSION_KEY);
    localStorage.removeItem(this.STATS_CACHE_KEY);
    this.invalidateCache();
  }

  public exportHistory(format: "json" | "csv" = "json"): string {
    const sessions = this.getAllChatSessions();

    if (format === "csv") {
      const headers = ["Session ID", "Title", "Created", "Messages", "Tokens", "Cost (cents)"];
      const rows = sessions.map((s) => [
        s.id,
        s.title,
        new Date(s.createdAt).toISOString(),
        s.messageCount.toString(),
        s.totalTokens.toString(),
        s.totalCost.toFixed(2),
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(sessions, null, 2);
  }

  public deleteSession(sessionId: string): boolean {
    const sessions = this.getAllSessions().filter((s) => s.id !== sessionId);
    this.saveAllSessions(sessions);

    // If deleting current session, clear it too
    const currentSession = this.getCurrentSession();
    if (currentSession?.id === sessionId) {
      localStorage.removeItem(this.CURRENT_SESSION_KEY);
      this.currentSessionCache = null;
    }

    return true;
  }

  // Get storage usage information
  public getStorageInfo() {
    const allData = JSON.stringify(this.getAllChatSessions());
    const sizeInBytes = new Blob([allData]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    const sizeInMB = sizeInKB / 1024;

    return {
      sessions: this.getAllChatSessions().length,
      sizeBytes: sizeInBytes,
      sizeKB: sizeInKB,
      sizeMB: parseFloat(sizeInMB.toFixed(2)),
      maxSessions: this.MAX_SESSIONS,
    };
  }
}

export const chatHistory = new ChatHistoryManager();
