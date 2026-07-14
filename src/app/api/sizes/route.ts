import { NextResponse } from 'next/server'
import { getSizes } from '@/services/product-options'

export function GET() {
  return NextResponse.json({ sizes: getSizes() })
}
