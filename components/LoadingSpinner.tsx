'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface LoadingSpinnerProps {
  message?: string
  showSkeleton?: boolean
}

export default function LoadingSpinner({ message = "Loading...", showSkeleton = false }: LoadingSpinnerProps) {
  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="loading-dots mb-4">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
