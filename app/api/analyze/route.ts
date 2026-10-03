import { NextResponse } from "next/server";
import { analyze } from "@/lib/pipeline";
import { AnalyzeRequestSchema, type ApiError, type Verdict } from "@/lib/schema";

// Node runtime (not Edge): provider SDKs and later audio/image handling need Node APIs.
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request.";
    return NextResponse.json<ApiError>({ error: message }, { status: 400 });
  }

  try {
    const verdict = await analyze(parsed.data);
    return NextResponse.json<Verdict>(verdict);
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json<ApiError>(
      { error: "Something went wrong while checking. Please try again." },
      { status: 500 },
    );
  }
}
