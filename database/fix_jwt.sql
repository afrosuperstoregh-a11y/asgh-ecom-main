-- Check Supabase configuration and fix JWT issues

-- Check current JWT settings
SELECT 
    name,
    setting
FROM pg_settings 
WHERE name LIKE '%jwt%';

-- Check if anon role exists
SELECT 
    rolname, 
    rolcanlogin,
    rolsuper
FROM pg_roles 
WHERE rolname = 'anon';

-- Check PostgREST settings
SELECT 
    name,
    value
FROM pg_settings 
WHERE name LIKE '%postgrest%';

-- Reset anon role if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
    
    RAISE NOTICE 'Anon role configured successfully';
END $$;

-- Test simple query without authentication
SELECT 'Test query successful' as result;
