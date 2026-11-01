-- ============================================================================
-- MAHER STOCK - COMPLEXE MAHER RESTAURANT ET PISCINE
-- Schema Migration 001: Initial Tables & Relations
-- ============================================================================

-- Enable pgcrypto / uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROLES
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_fr TEXT,
    description_ar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. DEPARTMENTS / SERVICES
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    department TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    pin_hash TEXT, -- Hashed PIN for manager physical handover confirmation
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#151936',
    icon TEXT DEFAULT 'Package',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SUPPLIERS / FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Casablanca',
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PRODUCTS / PRODUITS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    unit TEXT NOT NULL, -- 'kg', 'g', 'l', 'ml', 'piece', 'paquet', 'carton', 'bouteille', 'sac'
    physical_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (physical_stock >= 0),
    reserved_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (reserved_stock >= 0),
    min_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000 CHECK (min_stock >= 0),
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0), -- PMP Coût Moyen Pondéré
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    location TEXT, -- Emplacement physique dans la chambre économat
    image_url TEXT,
    qr_code_data TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_reserved_not_exceed_physical CHECK (reserved_stock <= physical_stock)
);

-- Available stock generated/virtual concept: (physical_stock - reserved_stock)

-- 7. STOCK ENTRIES / RÉCEPTION MARCHANDISES
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number TEXT UNIQUE NOT NULL, -- ENT-YYYY-XXXX
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_number TEXT,
    invoice_photo_url TEXT,
    received_by UUID NOT NULL REFERENCES public.profiles(id),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. STOCK REQUESTS / DEMANDES DE SORTIE
CREATE TABLE IF NOT EXISTS public.stock_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT UNIQUE NOT NULL, -- DEM-YYYY-XXXX
    employee_id UUID NOT NULL REFERENCES public.profiles(id),
    department TEXT NOT NULL REFERENCES public.departments(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'READY', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED')
    ),
    reason TEXT NOT NULL,
    notes TEXT,
    -- Approval
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    -- Rejection
    rejection_reason TEXT,
    rejected_by UUID REFERENCES public.profiles(id),
    rejected_at TIMESTAMPTZ,
    -- Preparation
    prepared_by UUID REFERENCES public.profiles(id),
    prepared_at TIMESTAMPTZ,
    -- Delivery
    delivered_by UUID REFERENCES public.profiles(id),
    delivered_at TIMESTAMPTZ,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. STOCK REQUEST ITEMS
CREATE TABLE IF NOT EXISTS public.stock_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.stock_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    requested_quantity NUMERIC(12, 3) NOT NULL CHECK (requested_quantity > 0),
    approved_quantity NUMERIC(12, 3) CHECK (approved_quantity IS NULL OR approved_quantity >= 0),
    delivered_quantity NUMERIC(12, 3) CHECK (delivered_quantity IS NULL OR delivered_quantity >= 0),
    unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'CANCELLED')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. STOCK RESERVATIONS
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    request_id UUID NOT NULL REFERENCES public.stock_requests(id) ON DELETE CASCADE,
    reserved_quantity NUMERIC(12, 3) NOT NULL CHECK (reserved_quantity > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'RELEASED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. STOCK MOVEMENTS (IMMUTABLE AUDIT OF ALL QUANTITY CHANGES)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_number TEXT UNIQUE NOT NULL, -- MOUV-YYYY-XXXX
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (
        movement_type IN ('ENTRY', 'EXIT', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUB', 'CANCEL_RESTORE')
    ),
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    stock_before NUMERIC(12, 3) NOT NULL,
    stock_after NUMERIC(12, 3) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('ENTRY', 'REQUEST', 'INVENTORY_ADJUSTMENT')),
    reference_id UUID,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. INVENTORY SESSIONS
CREATE TABLE IF NOT EXISTS public.inventory_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number TEXT UNIQUE NOT NULL, -- INV-YYYY-XXXX
    session_type TEXT NOT NULL CHECK (session_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'SPOT')),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    conducted_by UUID NOT NULL REFERENCES public.profiles(id),
    total_items_counted INTEGER NOT NULL DEFAULT 0,
    total_anomalies INTEGER NOT NULL DEFAULT 0,
    total_loss_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. INVENTORY ITEMS (COUNTED PRODUCTS IN A SESSION)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    theoretical_stock NUMERIC(12, 3) NOT NULL,
    physical_count NUMERIC(12, 3) NOT NULL CHECK (physical_count >= 0),
    difference NUMERIC(12, 3) NOT NULL, -- physical_count - theoretical_stock
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    difference_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    has_anomaly BOOLEAN NOT NULL DEFAULT false,
    justification TEXT,
    counted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. STOCK ADJUSTMENTS (ANOMALIES & AUTHORIZED CORRECTIONS)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number TEXT UNIQUE NOT NULL, -- ADJ-YYYY-XXXX
    inventory_session_id UUID REFERENCES public.inventory_sessions(id) ON DELETE SET NULL,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    previous_stock NUMERIC(12, 3) NOT NULL,
    adjusted_quantity NUMERIC(12, 3) NOT NULL, -- Difference (+ or -)
    new_stock NUMERIC(12, 3) NOT NULL CHECK (new_stock >= 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    authorized_by UUID REFERENCES public.profiles(id),
    authorized_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_role TEXT CHECK (recipient_role IN ('ADMIN', 'RESPONSABLE', 'EMPLOYEE', 'ALL')),
    title_fr TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    message_fr TEXT NOT NULL,
    message_ar TEXT NOT NULL,
    type TEXT NOT NULL, -- 'NEW_REQUEST', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_DELIVERED', 'LOW_STOCK', 'INVENTORY_DISCREPANCY', 'NEW_ENTRY', 'STOCK_ADJUSTMENT'
    reference_type TEXT,
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. AUDIT LOGS (ANTI-VOL & TRACKING STRICT IMMUTABLE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR PERFORMANCE AND INTEGRITY
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_entries_product ON public.stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON public.stock_entries(received_at);
CREATE INDEX IF NOT EXISTS idx_stock_requests_employee ON public.stock_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_stock_requests_status ON public.stock_requests(status);
CREATE INDEX IF NOT EXISTS idx_stock_requests_dept ON public.stock_requests(department);
CREATE INDEX IF NOT EXISTS idx_request_items_req ON public.stock_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_prod ON public.stock_request_items(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_prod ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sess ON public.inventory_items(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_anom ON public.inventory_items(has_anomaly);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recip ON public.notifications(recipient_id, is_read);
