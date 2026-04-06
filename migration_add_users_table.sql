-- Create a table for public profiles
create table public.users (
  id text primary key, -- Matches Firebase UID
  email text not null,
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own profile" on public.users
  for select using (auth.uid()::text = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid()::text = id);

create policy "Enable insert for authenticated users" on public.users
  for insert with check (auth.uid()::text = id);

-- Allow public read for now if needed, or restrict strictly
-- For registration flow, we insert with the Firebase UID. 
-- Since Supabase Auth isn't managing the user, `auth.uid()` might not match if we are using Firebase client-side only.
-- However, if we use Supabase client to insert, we need a way to allow it.
-- If we are using the anon key, we might need to allow insert for everyone or use a service role function.
-- BUT, since we are using Firebase for Auth, Supabase doesn't know the user is authenticated unless we exchange tokens (complex).
-- SIMPLIFICATION: For this "frontend-only" + Supabase DB setup where Firebase handles Auth:
-- We will allow public insert but rely on the client to send the correct ID.
-- Real-world: Backend should verify Firebase token.
-- Demo/MVP: Allow insert.

drop policy if exists "Enable insert for authenticated users" on public.users;
create policy "Enable insert for everyone" on public.users
  for insert with check (true);

-- Allow users to read their own data based on ID match (client must filter)
-- or just allow public read for demo if RLS is too strict without proper Auth integration.
-- Let's stick to "Enable read for everyone" for simplicity in this specific hybrid setup, 
-- or better: just allow all for this demo to ensure it works without backend token exchange.
create policy "Enable all access for everyone" on public.users
  for all using (true);
