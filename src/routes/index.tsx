import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to React FX Mockup</CardTitle>
          <CardDescription>
            Explore the app using the navigation below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Link to="/posts">
              <Button>View Posts</Button>
            </Link>
            <Link to="/users">
              <Button variant="secondary">View Users</Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            This app demonstrates TanStack Router with shadcn/ui components.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
