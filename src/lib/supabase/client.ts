/**
 * Browser Supabase client (SSR-aware). Prefer `@/utils/supabase/client` for auth UI.
 * This helper remains for simple reads without the cookies API.
 */
import { createClient as createBrowserClient } from "@/utils/supabase/client";

export { createBrowserClient as createBrowserSupabaseClient };
