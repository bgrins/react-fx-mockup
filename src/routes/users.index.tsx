import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/users/")({
  component: UsersIndexComponent,
});

function UsersIndexComponent(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a User</CardTitle>
        <CardDescription>Choose a user from the list to view their details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          No user selected. Browse through the user list to see their information.
        </p>
        <a href="/api/users" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            View as JSON
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
