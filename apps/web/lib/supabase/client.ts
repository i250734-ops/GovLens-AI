import { createBrowserClient } from "@supabase/ssr";

// Browser (client component) Supabase client. Anon key only — never the service role key.
//
// Deliberately does NOT use the shared getSupabaseEnv()/requireEnv(name) helper from
// ./env — that helper does process.env[name], a *dynamic* lookup. Next.js only inlines
// NEXT_PUBLIC_* vars into the browser bundle when it sees the *static* literal
// expression process.env.NEXT_PUBLIC_X at build time; a dynamic bracket lookup is left
// as-is and evaluates against an empty process.env in the browser at runtime, silently
// breaking client-side auth. Server-side code (server.ts, middleware-client.ts) doesn't
// have this restriction since real env vars exist at runtime there — only this
// browser-facing file needs the static form.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local against .env.example.",
    );
  }

  return createBrowserClient(url, anonKey);
}
