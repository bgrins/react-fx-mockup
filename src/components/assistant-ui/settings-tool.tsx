import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CheckIcon } from "lucide-react";

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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
        {args.reason && (
          <p className="text-sm text-muted-foreground">{args.reason}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </CardContent>
    </Card>
  );
}