import { ErrorComponentProps } from '@tanstack/react-router'
import { XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export function PostErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Post</AlertTitle>
        <AlertDescription>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{error.message}</p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm hover:underline">
                    View error details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto bg-destructive/10 p-2 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
            {reset && (
              <button
                onClick={reset}
                className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
