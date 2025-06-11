import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { i18nRouter } from 'next-i18n-router'
import i18nConfig from './next-i18n.config'

export async function middleware(request: NextRequest) {
  // Handle i18n routing
  const i18nResponse = i18nRouter(request, i18nConfig)
  if (i18nResponse) return i18nResponse

  // Handle Supabase auth
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 