import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from '../utils/posts'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/posts')({
  loader: async () => fetchPosts(),
  component: PostsComponent,
})

function PostsComponent() {
  const posts = Route.useLoaderData()

  return (
    <div className="container mx-auto p-6 flex gap-6">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-2">
              {[...posts, { id: 'i-do-not-exist', title: 'Non-existent Post' }].map(
                (post) => {
                  return (
                    <Link
                      key={post.id}
                      to="/posts/$postId"
                      params={{
                        postId: post.id,
                      }}
                      className="block p-3 rounded-lg hover:bg-accent transition-colors"
                      activeProps={{ className: 'bg-accent' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate pr-2">
                          {post.title.substring(0, 20)}
                        </span>
                        <Badge variant="secondary">Post</Badge>
                      </div>
                    </Link>
                  )
                },
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
