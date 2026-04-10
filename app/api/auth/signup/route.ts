import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type SignupRequestBody = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
};

function validatePassword(value: string) {
  const rules = [
    value.length >= 8,
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ];

  return rules.every(Boolean);
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Authentication is unavailable." }, { status: 500 });
  }

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY required for mandatory username signup." },
      { status: 500 }
    );
  }

  let body: SignupRequestBody;
  try {
    body = (await request.json()) as SignupRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const firstName = body.firstName?.trim() || "";
  const lastName = body.lastName?.trim() || "";
  const username = body.username?.trim().replace(/^@+/, "").toLowerCase() || "";
  const email = body.email?.trim() || "";
  const password = body.password || "";

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First name and last name are required." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-30 chars and only contain letters, numbers, or underscores." },
      { status: 400 }
    );
  }

  if (!validatePassword(password)) {
    return NextResponse.json(
      {
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      },
      { status: 400 }
    );
  }

  let cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies) {
        cookiesToSet = nextCookies;
      },
    },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from("user_profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (existingProfileError) {
    const missingProfilesTable = existingProfileError.message.includes("Could not find the table 'public.user_profiles'");
    if (missingProfilesTable) {
      return NextResponse.json(
        { error: "Username directory is missing. Run docs/SUPABASE_USERNAMES_SETUP.sql in Supabase SQL Editor." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: existingProfileError.message }, { status: 400 });
  }

  if (existingProfile?.user_id) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        username,
        full_name: fullName,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const newUserId = data.user?.id;
  if (!newUserId) {
    return NextResponse.json({ error: "Could not resolve the created user account." }, { status: 500 });
  }

  const { error: profileInsertError } = await adminClient.from("user_profiles").upsert(
    {
      user_id: newUserId,
      username,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (profileInsertError) {
    // Keep auth and username directory in sync by removing partial users if username reservation fails.
    await adminClient.auth.admin.deleteUser(newUserId).catch(() => undefined);

    if (profileInsertError.code === "23505") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const missingProfilesTable = profileInsertError.message.includes("Could not find the table 'public.user_profiles'");
    if (missingProfilesTable) {
      return NextResponse.json(
        { error: "Username directory is missing. Run docs/SUPABASE_USERNAMES_SETUP.sql in Supabase SQL Editor." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: profileInsertError.message }, { status: 400 });
  }

  const response = NextResponse.json({
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
      : null,
    requiresEmailVerification: !data.session,
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
