// Turns the technical error from a failed Supabase request into a plain sentence
// that says what is wrong and what to do about it.
export function explainDataError(error) {
  const msg = String(error?.message || error || '');
  const low = msg.toLowerCase();
  const code = String(error?.code || '');

  // Wrong or missing keys
  if (low.includes('invalid api key') || low.includes('no api key')) {
    return {
      title: "The Supabase keys look wrong",
      help: "Copy the Project URL and the anon public key from Supabase (Project Settings, then API) into .env.production again, then deploy again.",
    };
  }
  // Signed out / expired session
  if (code === 'PGRST301' || code === 'PGRST303' || low.includes('jwt')) {
    return {
      title: "Your sign-in has expired",
      help: "Sign out and sign in again.",
    };
  }
  // Database set up wrongly: table or column missing
  if (['PGRST205', 'PGRST204', '42P01', '42703'].includes(code) ||
      low.includes('schema cache') && !low.includes('could not query') ||
      low.includes('does not exist') || low.includes('could not find the')) {
    return {
      title: "Your Supabase database is missing something",
      help: "In Supabase open SQL Editor, paste the whole supabase_schema.sql file and press Run (it is safe to run again).",
    };
  }
  // Rules refuse access
  if (code === '42501' || low.includes('permission denied') || low.includes('row-level security')) {
    return {
      title: "Supabase is refusing access to the data",
      help: "Run supabase_schema.sql again in the Supabase SQL Editor so the access rules are applied, then sign in again.",
    };
  }
  // Can't reach Supabase at all, or it is waking up
  if (code === 'PGRST002' || /failed to fetch|networkerror|fetch failed|load failed|network request failed|timed out|gateway|bad gateway|service unavailable/.test(low)) {
    return {
      title: "Can't reach Supabase right now",
      help: "Check your internet connection. If it keeps happening, your free Supabase project may be paused: open supabase.com, open your project and click Restore.",
    };
  }
  return { title: "Something went wrong loading your data", help: msg || "Please try again." };
}
