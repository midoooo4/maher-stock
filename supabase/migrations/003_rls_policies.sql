-- ============================================================================
-- MAHER STOCK - COMPLEXE MAHER RESTAURANT ET PISCINE
-- Schema Migration 003: Row Level Security (RLS) Policies
-- ============================================================================

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to check if active user
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT is_active FROM public.profiles WHERE id = auth.uid();
$$;

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. ROLES & DEPARTMENTS (Read-only for all authenticated)
CREATE POLICY "Allow authenticated read roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read departments" ON public.departments
    FOR SELECT TO authenticated USING (true);

-- 2. PROFILES
CREATE POLICY "Users can read own profile or admin/manager can read all" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE')
    );

CREATE POLICY "Only admin can update profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.get_current_user_role() = 'ADMIN');

CREATE POLICY "Only admin can insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- 3. CATEGORIES & SUPPLIERS
CREATE POLICY "Authenticated read categories" ON public.categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin & manager manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'))
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "Authenticated read suppliers" ON public.suppliers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin & manager manage suppliers" ON public.suppliers
    FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'))
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

-- 4. PRODUCTS (Read for all, write for Admin & Responsable, NO HARD DELETIONS)
CREATE POLICY "Authenticated can view products" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin & manager can insert products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "Admin & manager can update products" ON public.products
    FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

-- 5. STOCK ENTRIES (Receptions)
CREATE POLICY "Authenticated can view stock entries" ON public.stock_entries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin & manager can insert stock entries" ON public.stock_entries
    FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

-- 6. STOCK REQUESTS
CREATE POLICY "Employees can view own requests, Admin & Manager view all" ON public.stock_requests
    FOR SELECT TO authenticated
    USING (
        employee_id = auth.uid() OR public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE')
    );

CREATE POLICY "Authenticated users can create stock requests" ON public.stock_requests
    FOR INSERT TO authenticated
    WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can cancel pending requests, Admin & Manager can update" ON public.stock_requests
    FOR UPDATE TO authenticated
    USING (
        (employee_id = auth.uid() AND status = 'PENDING') OR
        public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE')
    );

-- 7. STOCK REQUEST ITEMS
CREATE POLICY "View request items if can view request" ON public.stock_request_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.stock_requests sr
            WHERE sr.id = stock_request_items.request_id
            AND (sr.employee_id = auth.uid() OR public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'))
        )
    );

CREATE POLICY "Insert request items for own pending request" ON public.stock_request_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stock_requests sr
            WHERE sr.id = stock_request_items.request_id
            AND sr.employee_id = auth.uid()
        )
    );

-- 8. STOCK MOVEMENTS & RESERVATIONS (IMMUTABLE, READ-ONLY FOR AUTHORIZED)
CREATE POLICY "View stock movements" ON public.stock_movements
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "View stock reservations" ON public.stock_reservations
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

-- 9. INVENTORY SESSIONS & ITEMS
CREATE POLICY "Admin & manager view inventory sessions" ON public.inventory_sessions
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "Admin & manager manage inventory sessions" ON public.inventory_sessions
    FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "Admin & manager view inventory items" ON public.inventory_items
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "Admin & manager manage inventory items" ON public.inventory_items
    FOR ALL TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

-- 10. STOCK ADJUSTMENTS (Anomalies)
CREATE POLICY "Admin & manager view adjustments" ON public.stock_adjustments
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('ADMIN', 'RESPONSABLE'));

CREATE POLICY "Admin can update/authorize adjustments" ON public.stock_adjustments
    FOR UPDATE TO authenticated
    USING (public.get_current_user_role() = 'ADMIN');

-- 11. NOTIFICATIONS
CREATE POLICY "Users can read own notifications or broadcast by role" ON public.notifications
    FOR SELECT TO authenticated
    USING (
        recipient_id = auth.uid() OR
        recipient_role = public.get_current_user_role() OR
        recipient_role = 'ALL'
    );

CREATE POLICY "Users can update own notification is_read" ON public.notifications
    FOR UPDATE TO authenticated
    USING (recipient_id = auth.uid() OR recipient_role = public.get_current_user_role());

-- 12. AUDIT LOGS (STRICT IMMUTABLE READ-ONLY FOR ADMIN)
CREATE POLICY "Only admin can view audit logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.get_current_user_role() = 'ADMIN');

-- 13. SETTINGS
CREATE POLICY "Authenticated can read settings" ON public.settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admin can update settings" ON public.settings
    FOR ALL TO authenticated
    USING (public.get_current_user_role() = 'ADMIN');
