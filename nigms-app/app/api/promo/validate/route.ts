import { NextRequest, NextResponse } from "next/server";
import type { PromoValidateResponse } from "@/lib/types";

// Valid promo codes — server-side only, never exposed to the client bundle
const PROMO_CODES: Record<string, PromoValidateResponse> = {
  NAILEDIT: { valid: true, waivesDeposit: true },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, waivesDeposit: false }, { status: 400 });
  }

  const { code } = body as { code?: string };

  if (!code || typeof code !== "string") {
    return NextResponse.json<PromoValidateResponse>({ valid: false, waivesDeposit: false });
  }

  const result = PROMO_CODES[code.trim().toUpperCase()];
  if (result) {
    return NextResponse.json<PromoValidateResponse>(result);
  }

  return NextResponse.json<PromoValidateResponse>({ valid: false, waivesDeposit: false });
}
