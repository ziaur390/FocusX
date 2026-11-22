import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  confirmationPath,
  safeAuthNext,
  signupNextCookie,
} from "@/lib/auth-redirect";
import { readSupabaseEnv } from "@/lib/supabase/env";
import { createSupabase } from "@/lib/supabase/server";

function confirmationRedirect(destination: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: destination,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const failurePath = "/login?confirmation=failed";

  if (!tokenHash || searchParams.get("type") !== "email" || !readSupabaseEnv()) {
    return confirmationRedirect(failurePath);
  }

  const supabase = await createSupabase();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
  if (error || !data.session) {
    return confirmationRedirect(failurePath);
  }

  const cookieStore = await cookies();
  const destination = safeAuthNext(cookieStore.get(signupNextCookie)?.value);
  cookieStore.set(signupNextCookie, "", {
    path: confirmationPath,
    expires: new Date(0),
  });
  return confirmationRedirect(destination);
}
