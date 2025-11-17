-- Admin Users Table
-- This table stores admin users who can access the admin panel
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin Sessions Table (for tracking admin logins)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Generated Content Table
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    model TEXT DEFAULT 'claude-sonnet-4-5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Activity Log Table (audit trail)
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_content_admin ON ai_generated_content(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON admin_activity_log(created_at DESC);

-- RLS (Row Level Security) Policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can only see their own data
CREATE POLICY "Admins can view their own data" ON admin_users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Admins can view their own sessions" ON admin_sessions
    FOR ALL USING (admin_id IN (SELECT id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view their own content" ON ai_generated_content
    FOR ALL USING (admin_id IN (SELECT id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Admins can view their own activity" ON admin_activity_log
    FOR SELECT USING (admin_id IN (SELECT id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < now();
END;
$$ language 'plpgsql';

-- Note: Run this to create the first admin user (after replacing with bcrypt hash):
-- INSERT INTO admin_users (email, password_hash, full_name, is_active)
-- VALUES ('admin@example.com', 'YOUR_BCRYPT_HASH_HERE', 'System Administrator', true);
