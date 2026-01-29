from supabase import create_client
from configs.settings import SUPABASE_URL, SUPABASE_ANON_KEY

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("supabase credentials are missing, recheck .env file please!")

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)