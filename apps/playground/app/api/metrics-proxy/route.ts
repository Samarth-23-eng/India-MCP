import { NextResponse } from "next/server"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:3001"

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY_URL}/metrics`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Gateway error: ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 503 })
  }
}
