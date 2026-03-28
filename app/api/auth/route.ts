import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  console.log('Code reçu :', code)
  console.log('Code attendu :', process.env.MJ_CODE)

  if (code !== process.env.MJ_CODE) {
    return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set('mj_auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}