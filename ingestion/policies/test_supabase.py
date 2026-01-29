from core.supabase_client import supabase

res = supabase.table("policy_chunks").select("*").limit(1).execute()
print(res)