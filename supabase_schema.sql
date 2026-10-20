-- =============================================================================
-- INVENTECH KIOSK • UNIVERSIDAD DE DAGUPAN SCHOOL OF ENGINEERING
-- SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- =============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: EQUIPMENT INVENTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.equipment (
    id TEXT PRIMARY KEY,
    tag_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Equipment & Apparatus',
    lab TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Passed Inspection',
    condition TEXT NOT NULL DEFAULT 'Functional',
    unit TEXT NOT NULL DEFAULT 'pc',
    description TEXT,
    ched_req TEXT,
    room TEXT,
    safety_clearance TEXT DEFAULT 'Safe for Use',
    image TEXT,
    is_damaged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: BORROW TRANSACTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    transaction_id TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    program TEXT NOT NULL,
    year_level TEXT,
    semester TEXT,
    section TEXT,
    course_code TEXT,
    group_no TEXT DEFAULT '1',
    instructor TEXT,
    purpose TEXT,
    lab TEXT,
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    total_units INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'BORROWED', -- 'BORROWED', 'RETURNED', 'OVERDUE'
    signature TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    returned_at TIMESTAMPTZ
);

-- =============================================================================
-- TABLE: ADVANCE RESERVATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    tag_code TEXT,
    category TEXT,
    lab TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    program TEXT NOT NULL,
    year_level TEXT,
    semester TEXT,
    section TEXT,
    course_code TEXT,
    group_no TEXT,
    instructor TEXT,
    purpose TEXT,
    reserve_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'CLAIMED', 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: INCIDENT & DAMAGE LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.incident_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    item_id TEXT,
    item_name TEXT NOT NULL,
    tag_code TEXT,
    lab TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT,
    type TEXT NOT NULL, -- 'DAMAGED', 'MISSING', 'MALFUNCTION'
    details TEXT,
    status TEXT NOT NULL DEFAULT 'UNDER_INVESTIGATION', -- 'UNDER_INVESTIGATION', 'RESOLVED'
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- =============================================================================
-- TABLE: SECURITY & SYSTEM AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    action TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'CRITICAL'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Public Kiosk / Anonymously accessible for kiosk operation
-- =============================================================================
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read & write from Kiosk client (Anon key)
CREATE POLICY "Public full access to equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to incident_logs" ON public.incident_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to security_audit_logs" ON public.security_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for equipment, transactions, and reservations
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
