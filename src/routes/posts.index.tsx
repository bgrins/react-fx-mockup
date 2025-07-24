import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

export const Route = createFileRoute('/posts/')({
  component: PostsIndexComponent,
})

function PostsIndexComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Post</CardTitle>
        <CardDescription>
          Choose a post from the list on the left to view its details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          No post selected. Browse through the available posts to read their content.
        </p>
      </CardContent>
    </Card>
  )
}
