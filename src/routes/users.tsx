import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import type { User } from '../utils/users'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'

export const Route = createFileRoute('/users')({
  loader: async () => {
    const res = await fetch('/api/users')

    if (!res.ok) {
      throw new Error('Unexpected status code')
    }

    const data = (await res.json()) as Array<User>

    return data
  },
  component: UsersComponent,
})

function UsersComponent() {
  const users = Route.useLoaderData()

  return (
    <div className="container mx-auto p-6 flex gap-6">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-2">
              {[
                ...users,
                { id: 'i-do-not-exist', name: 'Non-existent User', email: '' },
              ].map((user) => {
                return (
                  <Link
                    key={user.id}
                    to="/users/$userId"
                    params={{
                      userId: String(user.id),
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                    activeProps={{ className: 'bg-accent' }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      {user.email && (
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      )}
                    </div>
                  </Link>
                )
              })}
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
