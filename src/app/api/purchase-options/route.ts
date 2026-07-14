import { NextResponse } from 'next/server'
import { getPurchaseOptions } from '@/services/product-options'

export function GET() {
  return NextResponse.json({ options: getPurchaseOptions() })
}
