import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveAccount } from "@/lib/services/accounts";
import type { ProviderCredentials } from "@/lib/adapters/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { provider, endpoint, bucket, accessKeyId, secretAccessKey, region, label } = body;

  if (provider !== "s3") {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "Missing S3 credentials" }, { status: 400 });
  }

  const credentials: ProviderCredentials = {
    accessToken: accessKeyId,
    extra: {
      endpoint,
      bucket,
      accessKeyId,
      secretAccessKey,
      region: region ?? "us-east-1",
    },
  };

  try {
    const account = await saveAccount(
      supabase,
      user.id,
      "s3",
      credentials,
      label ?? `S3: ${bucket}`
    );
    return NextResponse.json({ account });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection failed" },
      { status: 500 }
    );
  }
}
