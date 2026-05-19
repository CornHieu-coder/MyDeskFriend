import { NextResponse } from "next/server";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
  });
}
