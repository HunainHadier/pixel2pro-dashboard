# Pixel2Pro Admin

## First-time Supabase setup

1. In Supabase for project `nwbgydvzilngvtpkmymw`, open **SQL Editor** and run [supabase/schema.sql](supabase/schema.sql).
2. In **Authentication → Users**, create the admin email/password you will use to sign in.
3. Copy [.env.example](.env.example) to `.env.local`. The supplied project URL and publishable key are already configured in the local file.
4. Keep `VITE_ENABLE_LOCAL_LOGIN=false` for a real deployment. It uses Supabase Auth and the RLS policies in the schema protect all admin data.
5. Run `npm.cmd run dev`.

## Local-only login

Set `VITE_ENABLE_LOCAL_LOGIN=true` and choose `VITE_LOCAL_ADMIN_EMAIL` plus `VITE_LOCAL_ADMIN_PASSWORD` only when developing the interface locally. `VITE_*` variables are visible in browser code, so this must never be used as a production security mechanism. A local login does not create a Supabase Auth session; use a real Supabase user whenever the dashboard needs to read or modify protected cloud data.
