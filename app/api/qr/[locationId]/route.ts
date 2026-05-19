import { NextResponse } from "next/server";
import { getLocationById } from "@/lib/locations";
import { signDeskToken } from "@/lib/qr-token";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await params;
  const result = await getLocationById(locationId);

  if (!result.location) {
    return NextResponse.json({ error: "Desk not found." }, { status: 404 });
  }

  const token = signDeskToken(result.location.id);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = `${baseUrl}/scan?desk=${result.location.qr_slug}&token=${token}`;

  return NextResponse.json({ url });
}
