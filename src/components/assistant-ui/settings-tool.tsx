import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CheckIcon, BarChart3Icon, TrashIcon, DownloadIcon, EyeIcon, TrendingUpIcon, DollarSignIcon, ClockIcon, ActivityIcon } from "lucide-react";
import { chatHistory, type TokenStats, type ChatSession } from "~/lib/chat-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface SettingsToolProps {
  args: {
    settingsType?: string;
    reason?: string;
  };
  result?: unknown;
}

export function SettingsTool({ args }: SettingsToolProps) {
  const [formData, setFormData] = useState({
    username: "john_doe",
    email: "john@example.com",
    theme: "dark",
    notifications: true,
    language: "en",
    autoSave: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    // Load token stats and chat sessions
    setTokenStats(chatHistory.getTokenStats());
    setChatSessions(chatHistory.getAllChatSessions());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Settings updated:", formData);
    setSubmitted(true);
    
    // Simulate saving
    setTimeout(() => {
      setSubmitted(false);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      chatHistory.clearAllHistory();
      setTokenStats(chatHistory.getTokenStats());
      setChatSessions(chatHistory.getAllChatSessions());
      setSelectedSession(null);
      alert('Chat history cleared successfully!');
    }
  };

  const handleExportHistory = (format: 'json' | 'csv' = 'json') => {
    const historyData = chatHistory.exportHistory(format);
    const blob = new Blob([historyData], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      chatHistory.deleteSession(sessionId);
      setChatSessions(chatHistory.getAllChatSessions());
      setTokenStats(chatHistory.getTokenStats());
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckIcon className="h-5 w-5" />
            <span>Settings updated successfully!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5" />
          Settings & Analytics Dashboard
        </CardTitle>
        {args.reason && (
          <p className="text-sm text-muted-foreground">{args.reason}</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Token Analytics</TabsTrigger>
            <TabsTrigger value="history">Chat History</TabsTrigger>
            <TabsTrigger value="details">Session Details</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select 
                    id="theme"
                    value={formData.theme} 
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select 
                    id="language"
                    value={formData.language} 
                    onChange={(e) => handleInputChange("language", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => handleInputChange("notifications", e.target.checked)}
                    className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSave">Auto-save Changes</Label>
                  <input
                    id="autoSave"
                    type="checkbox"
                    checked={formData.autoSave}
                    onChange={(e) => handleInputChange("autoSave", e.target.checked)}
                    className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFormData({
                    username: "john_doe",
                    email: "john@example.com",
                    theme: "dark",
                    notifications: true,
                    language: "en",
                    autoSave: false,
                  })}
                >
                  Reset
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3Icon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Token Usage Analytics</h3>
            </div>
            
            {tokenStats ? (
              <div className="space-y-6">
                {/* Overview Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ActivityIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Total Chats</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{formatNumber(tokenStats.totalChats)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUpIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Total Tokens</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{formatNumber(tokenStats.totalTokens)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3Icon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Avg/Chat</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{formatNumber(tokenStats.averageTokensPerChat)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSignIcon className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Total Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">{formatCost(tokenStats.totalCost)}</div>
                  </div>
                </div>

                {/* Time-based Usage */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Today</div>
                    <div className="text-xl font-bold">{formatNumber(tokenStats.todayTokens)}</div>
                    <div className="text-xs text-muted-foreground">{formatCost(tokenStats.todayTokens * 0.00015)}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">This Week</div>
                    <div className="text-xl font-bold">{formatNumber(tokenStats.thisWeekTokens)}</div>
                    <div className="text-xs text-muted-foreground">{formatCost(tokenStats.thisWeekTokens * 0.00015)}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">This Month</div>
                    <div className="text-xl font-bold">{formatNumber(tokenStats.thisMonthTokens)}</div>
                    <div className="text-xs text-muted-foreground">{formatCost(tokenStats.thisMonthTokens * 0.00015)}</div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Token Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Prompt Tokens:</span>
                        <span className="font-mono text-sm">{formatNumber(tokenStats.totalPromptTokens)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Tokens:</span>
                        <span className="font-mono text-sm">{formatNumber(tokenStats.totalCompletionTokens)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average per Message:</span>
                        <span className="font-mono text-sm">{formatNumber(tokenStats.averageTokensPerMessage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Messages:</span>
                        <span className="font-mono text-sm">{formatNumber(tokenStats.totalMessages)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Model Usage</h4>
                    <div className="space-y-2">
                      {Object.entries(tokenStats.modelUsage).map(([model, usage]) => (
                        <div key={model} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{model}:</span>
                            <span className="font-mono text-sm">{formatNumber(usage.tokens)} tokens</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{usage.messages} messages</span>
                            <span>{formatCost(usage.cost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Daily Usage Chart (Simple Text Version) */}
                {tokenStats.dailyUsage.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Daily Usage</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tokenStats.dailyUsage.slice(-7).map((day) => (
                        <div key={day.date} className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                          <div className="flex gap-4 text-sm">
                            <span>{formatNumber(day.tokens)} tokens</span>
                            <span>{day.messages} messages</span>
                            <span>{formatCost(day.cost)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No analytics data available yet
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Chat History</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportHistory('csv')}>
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportHistory('json')}>
                  <DownloadIcon className="h-4 w-4 mr-1" />
                  Export JSON
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClearHistory}>
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chatSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{session.title}</h4>
                      {session.tags && session.tags.length > 0 && (
                        <div className="flex gap-1">
                          {session.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(session.createdAt)} • {session.messageCount} messages • {formatNumber(session.totalTokens)} tokens • {formatCost(session.totalCost)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedSession(session)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {chatSessions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No chat history available
              </div>
            )}

            <div className="bg-muted rounded-lg p-4 mt-4">
              <div className="text-sm font-medium mb-2">Storage Information</div>
              <div className="space-y-1 text-sm">
                <div>Total sessions: {chatSessions.length}</div>
                <div>Storage used: ~{Math.round((JSON.stringify(chatSessions).length / 1024))} KB</div>
                <div>Max sessions: 100 (older sessions auto-deleted)</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-6">
            {selectedSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedSession.title}</h3>
                  <Button variant="outline" onClick={() => setSelectedSession(null)}>
                    ← Back to History
                  </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm font-medium">Messages</div>
                    <div className="text-xl font-bold">{selectedSession.messageCount}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm font-medium">Total Tokens</div>
                    <div className="text-xl font-bold">{formatNumber(selectedSession.totalTokens)}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm font-medium">Total Cost</div>
                    <div className="text-xl font-bold">{formatCost(selectedSession.totalCost)}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-sm font-medium">Avg Response</div>
                    <div className="text-xl font-bold">
                      {selectedSession.averageResponseTime ? `${selectedSession.averageResponseTime.toFixed(0)}ms` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedSession.messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg ${
                      message.role === 'user' ? 'bg-blue-50 dark:bg-blue-950' : 'bg-green-50 dark:bg-green-950'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{message.role}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm mb-2">{message.content.substring(0, 200)}...</div>
                      {message.tokenUsage && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Tokens: {formatNumber(message.tokenUsage.totalTokens)}</span>
                          <span>Cost: {formatCost(message.tokenUsage.estimatedCost || 0)}</span>
                          {message.responseTime && <span>Time: {message.responseTime}ms</span>}
                        </div>
                      )}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-muted-foreground">Tools Used:</div>
                          <div className="flex gap-2 mt-1">
                            {message.toolCalls.map((tool, i) => (
                              <span key={i} className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 rounded">
                                {tool.toolName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <EyeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat session from the History tab to view detailed information</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}