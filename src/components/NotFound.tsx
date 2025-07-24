import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Page Not Found</AlertTitle>
        <AlertDescription>
          <div className="space-y-4">
            <div>
              {children || <p>The page you are looking for does not exist.</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => window.history.back()}
                className="bg-emerald-500 text-white px-3 py-1.5 rounded-md hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                Go back
              </button>
              <Link
                to="/"
                className="bg-cyan-600 text-white px-3 py-1.5 rounded-md hover:bg-cyan-700 transition-colors text-sm font-medium"
              >
                Start Over
              </Link>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
