'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Routes that should NOT have the header
  const excludedRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/signup/user',
    '/auth/signup/astrologer',
    '/debug-login',
    '/test-signup'
  ]
  
  // Check if current route should exclude header
  const shouldExcludeHeader = excludedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Don't render header on excluded routes
  if (shouldExcludeHeader) {
    return null
  }
  
  return <Header />
} 