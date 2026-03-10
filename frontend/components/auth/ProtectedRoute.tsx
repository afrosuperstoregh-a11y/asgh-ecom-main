'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    // Check if admin is required
    if (requireAdmin) {
      const userRole = user.user_metadata?.role || 'customer'
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        router.push('/')
        return
      }
    }
  }, [user, loading, router, requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireAdmin) {
    const userRole = user.user_metadata?.role || 'customer'
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return null
    }
  }

  return <>{children}</>
}
