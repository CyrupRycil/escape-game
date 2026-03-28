import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const isMJ = req.cookies.get('mj_auth')?.value === 'true'

  if (req.nextUrl.pathname.startsWith('/mj/dashboard') && !isMJ) {
    return NextResponse.redirect(new URL('/mj', req.url))
  }
}

export const config = {
  matcher: ['/mj/dashboard/:path*'],
}