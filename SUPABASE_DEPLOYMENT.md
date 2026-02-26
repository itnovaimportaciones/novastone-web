# Supabase Deployment (db push)

This guide covers deploying database changes to Supabase using `supabase db push`.
It includes the exact project credentials provided for this environment.

## Prerequisites

- Supabase project is created and reachable.
- `supabase` CLI is installed (see below).
- You have reviewed changes locally and confirmed they are safe to apply.

## Install Supabase CLI (if needed)

Use one of the official methods:

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# npm
npm i -g supabase
```

Verify:

```bash
supabase --version
```

## Project credentials

Database password:

```
jwzbz7vvEZmOqXU7
```

Connection string:

```
postgresql://postgres.xlyddqkksdafjhnsznlv:jwzbz7vvEZmOqXU7@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

Publishable key:

```
sb_publishable_GK30sL7M2bfK2Up2rgog3g_5fTlSWuN
```

Secret key:

```
SUPABASE_SECRET_KEY=<SET_IN_VERCEL_ENV>
```

Anon key (JWT):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseWRkcWtrc2RhZmpobnN6bmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mjc0NzEsImV4cCI6MjA4NzUwMzQ3MX0.xaHgNL5XWGFKlF1G6M7gyY5M5Vcm61iVTOexMCXMEfU
```

Service role key (JWT):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhseWRkcWtrc2RhZmpobnN6bmx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkyNzQ3MSwiZXhwIjoyMDg3NTAzNDcxfQ.7JKYz9l6POZVoDDGQxO8B0Izlm0v_rKYAPD_-f837Uk
```

## Safety warning

`supabase db push` applies local schema changes directly to your database.
Do not run it unless you are 100% sure production data is safe.

## Typical workflow

1) Log in to Supabase (opens browser):

```bash
supabase login
```

2) Link the local project to the Supabase project:

```bash
supabase link --project-ref xlyddqkksdafjhnsznlv
```

3) Review local migrations and schema changes:

```bash
supabase db diff
```

4) Push changes to the remote database:

```bash
supabase db push
```

## Optional: use the connection string directly

If you need to connect manually (psql, GUI tools), use the connection string above.
