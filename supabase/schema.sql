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
-- ============================================================================
-- MAHER STOCK - COMPLEXE MAHER RESTAURANT ET PISCINE
-- Schema Migration 002: Secure Functions & Atomic Stock Transactions
-- ============================================================================

-- Function to generate sequential human-readable numbers
CREATE OR REPLACE FUNCTION public.generate_document_number(p_prefix TEXT, p_table_name TEXT, p_column_name TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
    v_year TEXT;
    v_count INT;
    v_number TEXT;
BEGIN
    v_year := to_char(now(), 'YYYY');
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I LIKE %L', p_table_name, p_column_name, p_prefix || '-' || v_year || '-%')
    INTO v_count;
    v_number := p_prefix || '-' || v_year || '-' || lpad((v_count + 1)::TEXT, 4, '0');
    RETURN v_number;
END;
$$;

-- 1. RECEIVE STOCK (RÉCEPTION MARCHANDISES)
CREATE OR REPLACE FUNCTION public.receive_stock(
    p_product_id UUID,
    p_quantity NUMERIC,
    p_unit_price NUMERIC,
    p_supplier_id UUID,
    p_invoice_number TEXT,
    p_invoice_photo_url TEXT,
    p_notes TEXT,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_user_name TEXT;
    v_user_email TEXT;
    v_product RECORD;
    v_new_physical_stock NUMERIC;
    v_new_pmp NUMERIC;
    v_entry_num TEXT;
    v_entry_id UUID;
    v_movement_num TEXT;
BEGIN
    -- Verify User & Role
    SELECT role, full_name, email INTO v_user_role, v_user_name, v_user_email
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_role NOT IN ('ADMIN', 'RESPONSABLE') THEN
        RAISE EXCEPTION 'Accès refusé: Seuls les administrateurs et responsables peuvent réceptionner des marchandises.';
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La quantité reçue doit être strictement supérieure à 0.';
    END IF;

    -- Lock Product Row for atomic update
    SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit introuvable.';
    END IF;

    -- Calculate Weighted Average Cost (PMP - Coût Moyen Pondéré)
    -- PMP = (Ancien Stock * Ancien Prix + Quantité Reçue * Prix Réception) / (Ancien Stock + Quantité Reçue)
    IF (v_product.physical_stock + p_quantity) > 0 THEN
        v_new_pmp := ROUND(
            ((v_product.physical_stock * v_product.purchase_price) + (p_quantity * p_unit_price)) 
            / (v_product.physical_stock + p_quantity),
            2
        );
    ELSE
        v_new_pmp := p_unit_price;
    END IF;

    v_new_physical_stock := v_product.physical_stock + p_quantity;
    v_entry_num := public.generate_document_number('ENT', 'stock_entries', 'entry_number');

    -- Insert stock entry
    INSERT INTO public.stock_entries (
        entry_number, product_id, quantity, unit_price, total_price,
        supplier_id, invoice_number, invoice_photo_url, received_by, notes
    ) VALUES (
        v_entry_num, p_product_id, p_quantity, p_unit_price, (p_quantity * p_unit_price),
        p_supplier_id, p_invoice_number, p_invoice_photo_url, p_user_id, p_notes
    ) RETURNING id INTO v_entry_id;

    -- Update Product physical stock and PMP
    UPDATE public.products
    SET physical_stock = v_new_physical_stock,
        purchase_price = v_new_pmp,
        updated_at = now()
    WHERE id = p_product_id;

    -- Insert stock movement
    v_movement_num := public.generate_document_number('MOUV', 'stock_movements', 'movement_number');
    INSERT INTO public.stock_movements (
        movement_number, product_id, movement_type, quantity,
        stock_before, stock_after, unit_cost, total_cost,
        reference_type, reference_id, performed_by, notes
    ) VALUES (
        v_movement_num, p_product_id, 'ENTRY', p_quantity,
        v_product.physical_stock, v_new_physical_stock, p_unit_price, (p_quantity * p_unit_price),
        'ENTRY', v_entry_id, p_user_id, COALESCE(p_notes, 'Réception livraison ' || v_entry_num)
    );

    -- Log Audit
    INSERT INTO public.audit_logs (
        user_id, user_email, user_name, user_role,
        action, entity_type, entity_id,
        old_values, new_values, notes
    ) VALUES (
        p_user_id, v_user_email, v_user_name, v_user_role,
        'STOCK_ENTRY', 'stock_entries', v_entry_id::TEXT,
        jsonb_build_object('physical_stock', v_product.physical_stock, 'purchase_price', v_product.purchase_price),
        jsonb_build_object('physical_stock', v_new_physical_stock, 'purchase_price', v_new_pmp, 'quantity', p_quantity),
        'Réception marchandise: ' || v_product.name_fr || ' (' || p_quantity || ' ' || v_product.unit || ')'
    );

    -- Notify Admin
    INSERT INTO public.notifications (
        recipient_role, title_fr, title_ar,
        message_fr, message_ar,
        type, reference_type, reference_id
    ) VALUES (
        'ADMIN',
        'Nouvelle réception marchandise',
        'استلام شحنة جديدة',
        'Réception de ' || p_quantity || ' ' || v_product.unit || ' pour ' || v_product.name_fr || ' par ' || v_user_name,
        'تم استلام ' || p_quantity || ' ' || v_product.unit || ' من ' || v_product.name_ar || ' بواسطة ' || v_user_name,
        'NEW_ENTRY', 'stock_entries', v_entry_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'entry_id', v_entry_id,
        'entry_number', v_entry_num,
        'new_stock', v_new_physical_stock,
        'new_pmp', v_new_pmp
    );
END;
$$;

-- 2. APPROVE STOCK REQUEST (RÈGLE: RÉSERVE LE STOCK SANS LE SORTIR PHYSIQUEMENT)
CREATE OR REPLACE FUNCTION public.approve_stock_request(
    p_request_id UUID,
    p_items_approved JSONB, -- Array of {item_id: UUID, approved_quantity: NUMERIC}
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_user_name TEXT;
    v_user_email TEXT;
    v_request RECORD;
    v_item RECORD;
    v_product RECORD;
    v_item_data JSONB;
    v_approved_qty NUMERIC;
    v_item_id UUID;
BEGIN
    SELECT role, full_name, email INTO v_user_role, v_user_name, v_user_email
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_role NOT IN ('ADMIN', 'RESPONSABLE') THEN
        RAISE EXCEPTION 'Accès refusé: Seuls les administrateurs et responsables peuvent valider une demande.';
    END IF;

    SELECT * INTO v_request FROM public.stock_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Demande de sortie introuvable.';
    END IF;

    -- Règle métier 13: Un employé/responsable ne peut pas approuver sa propre demande
    IF v_request.employee_id = p_user_id THEN
        RAISE EXCEPTION 'Règle de sécurité: Vous ne pouvez pas valider une demande que vous avez vous-même créée.';
    END IF;

    IF v_request.status NOT IN ('PENDING') THEN
        RAISE EXCEPTION 'Impossible de valider: la demande n''est plus en attente (Statut: %)', v_request.status;
    END IF;

    -- Process each approved item
    FOR v_item_data IN SELECT * FROM jsonb_array_elements(p_items_approved)
    LOOP
        v_item_id := (v_item_data->>'item_id')::UUID;
        v_approved_qty := (v_item_data->>'approved_quantity')::NUMERIC;

        IF v_approved_qty < 0 THEN
            RAISE EXCEPTION 'La quantité approuvée ne peut pas être négative.';
        END IF;

        SELECT * INTO v_item FROM public.stock_request_items WHERE id = v_item_id AND request_id = p_request_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Élément de demande introuvable: %', v_item_id;
        END IF;

        -- Check available stock (physical_stock - reserved_stock)
        SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;

        IF v_approved_qty > (v_product.physical_stock - v_product.reserved_stock) THEN
            RAISE EXCEPTION 'Stock disponible insuffisant pour %: demandé %, disponible %',
                v_product.name_fr, v_approved_qty, (v_product.physical_stock - v_product.reserved_stock);
        END IF;

        -- Update item status and approved quantity
        UPDATE public.stock_request_items
        SET approved_quantity = v_approved_qty,
            status = CASE WHEN v_approved_qty > 0 THEN 'APPROVED' ELSE 'REJECTED' END
        WHERE id = v_item_id;

        -- Create Reservation and increment reserved_stock if > 0
        IF v_approved_qty > 0 THEN
            INSERT INTO public.stock_reservations (
                product_id, request_id, reserved_quantity, status
            ) VALUES (
                v_item.product_id, p_request_id, v_approved_qty, 'ACTIVE'
            );

            UPDATE public.products
            SET reserved_stock = reserved_stock + v_approved_qty,
                updated_at = now()
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    -- Update Request status to APPROVED
    UPDATE public.stock_requests
    SET status = 'APPROVED',
        approved_by = p_user_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id, user_email, user_name, user_role,
        action, entity_type, entity_id,
        old_values, new_values, notes
    ) VALUES (
        p_user_id, v_user_email, v_user_name, v_user_role,
        'REQUEST_APPROVE', 'stock_requests', p_request_id::TEXT,
        jsonb_build_object('status', 'PENDING'),
        jsonb_build_object('status', 'APPROVED', 'approved_by', p_user_id, 'items', p_items_approved),
        'Demande ' || v_request.request_number || ' approuvée. Stock réservé.'
    );

    -- Notify Employee
    INSERT INTO public.notifications (
        recipient_id, title_fr, title_ar,
        message_fr, message_ar,
        type, reference_type, reference_id
    ) VALUES (
        v_request.employee_id,
        'Demande approuvée (' || v_request.request_number || ')',
        'تمت الموافقة على الطلب (' || v_request.request_number || ')',
        'Votre demande a été approuvée par le responsable. En attente de préparation.',
        'تمت الموافقة على طلبك من طرف المسؤول. في انتظار التحضير والتسليم.',
        'REQUEST_APPROVED', 'stock_requests', p_request_id
    );

    RETURN jsonb_build_object('success', true, 'status', 'APPROVED', 'request_id', p_request_id);
END;
$$;

-- 3. REJECT STOCK REQUEST
CREATE OR REPLACE FUNCTION public.reject_stock_request(
    p_request_id UUID,
    p_reason TEXT,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_user_name TEXT;
    v_user_email TEXT;
    v_request RECORD;
BEGIN
    SELECT role, full_name, email INTO v_user_role, v_user_name, v_user_email
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_role NOT IN ('ADMIN', 'RESPONSABLE') THEN
        RAISE EXCEPTION 'Accès refusé: Seuls les administrateurs et responsables peuvent refuser une demande.';
    END IF;

    IF TRIM(COALESCE(p_reason, '')) = '' THEN
        RAISE EXCEPTION 'Un motif de refus est obligatoire.';
    END IF;

    SELECT * INTO v_request FROM public.stock_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Demande de sortie introuvable.';
    END IF;

    IF v_request.status NOT IN ('PENDING') THEN
        RAISE EXCEPTION 'Impossible de refuser: la demande a déjà le statut %', v_request.status;
    END IF;

    -- Update request
    UPDATE public.stock_requests
    SET status = 'REJECTED',
        rejection_reason = p_reason,
        rejected_by = p_user_id,
        rejected_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    UPDATE public.stock_request_items
    SET status = 'REJECTED'
    WHERE request_id = p_request_id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id, user_email, user_name, user_role,
        action, entity_type, entity_id,
        old_values, new_values, notes
    ) VALUES (
        p_user_id, v_user_email, v_user_name, v_user_role,
        'REQUEST_REJECT', 'stock_requests', p_request_id::TEXT,
        jsonb_build_object('status', v_request.status),
        jsonb_build_object('status', 'REJECTED', 'reason', p_reason),
        'Demande ' || v_request.request_number || ' refusée: ' || p_reason
    );

    -- Notify Employee
    INSERT INTO public.notifications (
        recipient_id, title_fr, title_ar,
        message_fr, message_ar,
        type, reference_type, reference_id
    ) VALUES (
        v_request.employee_id,
        'Demande refusée (' || v_request.request_number || ')',
        'تم رفض الطلب (' || v_request.request_number || ')',
        'Votre demande a été refusée. Motif : ' || p_reason,
        'تم رفض طلبك. السبب: ' || p_reason,
        'REQUEST_REJECTED', 'stock_requests', p_request_id
    );

    RETURN jsonb_build_object('success', true, 'status', 'REJECTED');
END;
$$;

-- 4. PREPARE STOCK REQUEST (READY FOR PICKUP)
CREATE OR REPLACE FUNCTION public.prepare_stock_request(
    p_request_id UUID,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_user_name TEXT;
    v_request RECORD;
BEGIN
    SELECT role, full_name INTO v_user_role, v_user_name
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_role NOT IN ('ADMIN', 'RESPONSABLE') THEN
        RAISE EXCEPTION 'Accès refusé.';
    END IF;

    SELECT * INTO v_request FROM public.stock_requests WHERE id = p_request_id FOR UPDATE;
    IF v_request.status != 'APPROVED' THEN
        RAISE EXCEPTION 'Seule une demande approuvée peut être marquée comme préparée.';
    END IF;

    UPDATE public.stock_requests
    SET status = 'READY',
        prepared_by = p_user_id,
        prepared_at = now(),
        updated_at = now()
    WHERE id = p_request_id;

    -- Notify Employee
    INSERT INTO public.notifications (
        recipient_id, title_fr, title_ar,
        message_fr, message_ar,
        type, reference_type, reference_id
    ) VALUES (
        v_request.employee_id,
        'Commande préparée (' || v_request.request_number || ')',
        'تم تجهيز الطلبية (' || v_request.request_number || ')',
        'Vos articles sont prêts à l''économat. Veuillez vous présenter pour la remise.',
        'أغراضك جاهزة في غرفة المخزن. يرجى التوجه للاستلام الفعلي.',
        'REQUEST_READY', 'stock_requests', p_request_id
    );

    RETURN jsonb_build_object('success', true, 'status', 'READY');
END;
$$;

-- 5. CONFIRM PHYSICAL DELIVERY (CONFIRMER LA REMISE RÉELLE - DIMINUE LE STOCK ICI SEULEMENT)
CREATE OR REPLACE FUNCTION public.deliver_stock_request(
    p_request_id UUID,
    p_delivered_items JSONB, -- Array of {item_id: UUID, delivered_quantity: NUMERIC}
    p_delivery_notes TEXT,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_user_name TEXT;
    v_user_email TEXT;
    v_request RECORD;
    v_item RECORD;
    v_product RECORD;
    v_item_data JSONB;
    v_item_id UUID;
    v_delivered_qty NUMERIC;
    v_movement_num TEXT;
    v_is_partial BOOLEAN := false;
    v_final_status TEXT;
    v_total_delivered NUMERIC := 0;
BEGIN
    SELECT role, full_name, email INTO v_user_role, v_user_name, v_user_email
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_role NOT IN ('ADMIN', 'RESPONSABLE') THEN
        RAISE EXCEPTION 'Accès refusé: Seuls les administrateurs et responsables peuvent confirmer la remise.';
    END IF;

    SELECT * INTO v_request FROM public.stock_requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Demande introuvable.';
    END IF;

    IF v_request.status NOT IN ('APPROVED', 'READY') THEN
        RAISE EXCEPTION 'La remise ne peut être confirmée que pour une demande approuvée ou préparée (Statut actuel: %)', v_request.status;
    END IF;

    -- Loop through each delivered item
    FOR v_item_data IN SELECT * FROM jsonb_array_elements(p_delivered_items)
    LOOP
        v_item_id := (v_item_data->>'item_id')::UUID;
        v_delivered_qty := (v_item_data->>'delivered_quantity')::NUMERIC;

        IF v_delivered_qty < 0 THEN
            RAISE EXCEPTION 'La quantité remise ne peut pas être négative.';
        END IF;

        SELECT * INTO v_item FROM public.stock_request_items WHERE id = v_item_id AND request_id = p_request_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Élément introuvable: %', v_item_id;
        END IF;

        -- Lock product
        SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;

        -- Release reservation first
        IF COALESCE(v_item.approved_quantity, 0) > 0 THEN
            UPDATE public.products
            SET reserved_stock = GREATEST(0, reserved_stock - v_item.approved_quantity)
            WHERE id = v_item.product_id;

            UPDATE public.stock_reservations
            SET status = 'FULFILLED', updated_at = now()
            WHERE request_id = p_request_id AND product_id = v_item.product_id AND status = 'ACTIVE';
        END IF;

        -- Verify physical stock before deducting
        IF v_delivered_qty > v_product.physical_stock THEN
            RAISE EXCEPTION 'Stock physique insuffisant pour %: physique %, souhaité remettre %',
                v_product.name_fr, v_product.physical_stock, v_delivered_qty;
        END IF;

        -- Deduct physical stock
        UPDATE public.products
        SET physical_stock = physical_stock - v_delivered_qty,
            updated_at = now()
        WHERE id = v_item.product_id;

        -- Update item delivered quantity
        UPDATE public.stock_request_items
        SET delivered_quantity = v_delivered_qty,
            status = 'DELIVERED'
        WHERE id = v_item_id;

        -- Check if partial
        IF v_delivered_qty < COALESCE(v_item.approved_quantity, v_item.requested_quantity) THEN
            v_is_partial := true;
        END IF;

        v_total_delivered := v_total_delivered + v_delivered_qty;

        -- Generate Stock Movement EXIT for traceability
        IF v_delivered_qty > 0 THEN
            v_movement_num := public.generate_document_number('MOUV', 'stock_movements', 'movement_number');
            INSERT INTO public.stock_movements (
                movement_number, product_id, movement_type, quantity,
                stock_before, stock_after, unit_cost, total_cost,
                reference_type, reference_id, performed_by, notes
            ) VALUES (
                v_movement_num, v_item.product_id, 'EXIT', v_delivered_qty,
                v_product.physical_stock, (v_product.physical_stock - v_delivered_qty),
                v_product.purchase_price, (v_delivered_qty * v_product.purchase_price),
                'REQUEST', p_request_id, p_user_id,
                'Sortie validée pour demande ' || v_request.request_number || ' (' || v_request.department || ')'
            );
        END IF;
    END LOOP;

    v_final_status := CASE WHEN v_is_partial THEN 'PARTIALLY_DELIVERED' ELSE 'DELIVERED' END;

    UPDATE public.stock_requests
    SET status = v_final_status,
        delivered_by = p_user_id,
        delivered_at = now(),
        delivery_notes = p_delivery_notes,
        updated_at = now()
    WHERE id = p_request_id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id, user_email, user_name, user_role,
        action, entity_type, entity_id,
        old_values, new_values, notes
    ) VALUES (
        p_user_id, v_user_email, v_user_name, v_user_role,
        'REQUEST_DELIVER', 'stock_requests', p_request_id::TEXT,
        jsonb_build_object('status', v_request.status),
        jsonb_build_object('status', v_final_status, 'items', p_delivered_items),
        'Remise physique effectuée pour ' || v_request.request_number || '. Stock physique décrémenté.'
    );

    -- Notify Employee
    INSERT INTO public.notifications (
        recipient_id, title_fr, title_ar,
        message_fr, message_ar,
        type, reference_type, reference_id
    ) VALUES (
        v_request.employee_id,
        'Produits remis avec succès (' || v_request.request_number || ')',
        'تم تسليم المنتجات بنجاح (' || v_request.request_number || ')',
        'La remise physique de votre demande a été confirmée par le responsable.',
        'تم تأكيد تسليم طلبك بنجاح من طرف مسؤول المخزن.',
        'REQUEST_DELIVERED', 'stock_requests', p_request_id
    );

    -- Check for low stock alerts on affected products
    FOR v_item_data IN SELECT * FROM jsonb_array_elements(p_delivered_items)
    LOOP
        v_item_id := (v_item_data->>'item_id')::UUID;
        SELECT p.* INTO v_product FROM public.products p
        JOIN public.stock_request_items sri ON sri.product_id = p.id
        WHERE sri.id = v_item_id;

        IF (v_product.physical_stock - v_product.reserved_stock) <= v_product.min_stock THEN
            INSERT INTO public.notifications (
                recipient_role, title_fr, title_ar,
                message_fr, message_ar,
                type, reference_type, reference_id
            ) VALUES (
                'RESPONSABLE',
                'Alerte: Stock faible pour ' || v_product.name_fr,
                'تنبيه: مخزون منخفض لـ ' || v_product.name_ar,
                'Le stock disponible (' || (v_product.physical_stock - v_product.reserved_stock) || ' ' || v_product.unit || ') est inférieur au seuil minimal (' || v_product.min_stock || ').',
                'المخزون المتوفر (' || (v_product.physical_stock - v_product.reserved_stock) || ' ' || v_product.unit || ') أقل من الحد الأدنى (' || v_product.min_stock || ').',
                'LOW_STOCK', 'products', v_product.id
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'status', v_final_status);
END;
$$;

-- 6. CANCEL STOCK REQUEST
CREATE OR REPLACE FUNCTION public.cancel_stock_request(
    p_request_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Annulé par l''utilisateur'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_request RECORD;
    v_res RECORD;
BEGIN
    SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
    SELECT * INTO v_request FROM public.stock_requests WHERE id = p_request_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Demande introuvable.';
    END IF;

    -- Only creator (if still PENDING) or ADMIN/RESPONSABLE can cancel
    IF v_user_role = 'EMPLOYEE' AND v_request.employee_id != p_user_id THEN
        RAISE EXCEPTION 'Vous ne pouvez pas annuler la demande d''un autre employé.';
    END IF;

    IF v_user_role = 'EMPLOYEE' AND v_request.status NOT IN ('PENDING') THEN
        RAISE EXCEPTION 'Un employé ne peut annuler une demande qu''en statut En attente.';
    END IF;

    IF v_request.status IN ('DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED', 'REJECTED') THEN
        RAISE EXCEPTION 'Impossible d''annuler une demande déjà finalisée (Statut: %)', v_request.status;
    END IF;

    -- Release any active reservations if it was approved
    FOR v_res IN SELECT * FROM public.stock_reservations WHERE request_id = p_request_id AND status = 'ACTIVE'
    LOOP
        UPDATE public.products
        SET reserved_stock = GREATEST(0, reserved_stock - v_res.reserved_quantity),
            updated_at = now()
        WHERE id = v_res.product_id;

        UPDATE public.stock_reservations
        SET status = 'RELEASED', updated_at = now()
        WHERE id = v_res.id;
    END LOOP;

    UPDATE public.stock_requests
    SET status = 'CANCELLED',
        rejection_reason = p_reason,
        updated_at = now()
    WHERE id = p_request_id;

    UPDATE public.stock_request_items
    SET status = 'CANCELLED'
    WHERE request_id = p_request_id;

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values, notes
    ) VALUES (
        p_user_id, 'REQUEST_CANCEL', 'stock_requests', p_request_id::TEXT,
        jsonb_build_object('status', v_request.status),
        jsonb_build_object('status', 'CANCELLED', 'reason', p_reason),
        'Demande ' || v_request.request_number || ' annulée. Réservations libérées.'
    );

    RETURN jsonb_build_object('success', true, 'status', 'CANCELLED');
END;
$$;

-- 7. AUTHORIZE INVENTORY ADJUSTMENT (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.authorize_inventory_adjustment(
    p_adjustment_id UUID,
    p_approved BOOLEAN,
    p_admin_notes TEXT,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_role TEXT;
    v_user_name TEXT;
    v_user_email TEXT;
    v_adj RECORD;
    v_product RECORD;
    v_movement_num TEXT;
    v_movement_type TEXT;
    v_qty NUMERIC;
BEGIN
    SELECT role, full_name, email INTO v_user_role, v_user_name, v_user_email
    FROM public.profiles WHERE id = p_user_id;

    IF v_user_role != 'ADMIN' THEN
        RAISE EXCEPTION 'Seul l''administrateur propriétaire peut autoriser une correction de stock.';
    END IF;

    SELECT * INTO v_adj FROM public.stock_adjustments WHERE id = p_adjustment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ajustement introuvable.';
    END IF;

    IF v_adj.status != 'PENDING_APPROVAL' THEN
        RAISE EXCEPTION 'Cet ajustement a déjà été traité (Statut: %)', v_adj.status;
    END IF;

    IF p_approved THEN
        SELECT * INTO v_product FROM public.products WHERE id = v_adj.product_id FOR UPDATE;

        -- Apply correction to physical stock
        UPDATE public.products
        SET physical_stock = v_adj.new_stock,
            updated_at = now()
        WHERE id = v_adj.product_id;

        -- Determine movement type
        IF v_adj.adjusted_quantity > 0 THEN
            v_movement_type := 'ADJUSTMENT_ADD';
            v_qty := v_adj.adjusted_quantity;
        ELSE
            v_movement_type := 'ADJUSTMENT_SUB';
            v_qty := ABS(v_adj.adjusted_quantity);
        END IF;

        -- Record movement
        v_movement_num := public.generate_document_number('MOUV', 'stock_movements', 'movement_number');
        INSERT INTO public.stock_movements (
            movement_number, product_id, movement_type, quantity,
            stock_before, stock_after, unit_cost, total_cost,
            reference_type, reference_id, performed_by, notes
        ) VALUES (
            v_movement_num, v_adj.product_id, v_movement_type, v_qty,
            v_adj.previous_stock, v_adj.new_stock, v_product.purchase_price, (v_qty * v_product.purchase_price),
            'INVENTORY_ADJUSTMENT', p_adjustment_id, p_user_id,
            'Correction d''inventaire validée par propriétaire: ' || COALESCE(p_admin_notes, v_adj.reason)
        );

        UPDATE public.stock_adjustments
        SET status = 'APPROVED',
            authorized_by = p_user_id,
            authorized_at = now(),
            admin_notes = p_admin_notes
        WHERE id = p_adjustment_id;
    ELSE
        UPDATE public.stock_adjustments
        SET status = 'REJECTED',
            authorized_by = p_user_id,
            authorized_at = now(),
            admin_notes = p_admin_notes
        WHERE id = p_adjustment_id;
    END IF;

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id, user_email, user_name, user_role,
        action, entity_type, entity_id,
        old_values, new_values, notes
    ) VALUES (
        p_user_id, v_user_email, v_user_name, v_user_role,
        'STOCK_ADJUSTMENT_AUTHORIZE', 'stock_adjustments', p_adjustment_id::TEXT,
        jsonb_build_object('status', 'PENDING_APPROVAL'),
        jsonb_build_object('status', CASE WHEN p_approved THEN 'APPROVED' ELSE 'REJECTED' END, 'admin_notes', p_admin_notes),
        'Décision sur anomalie d''inventaire ' || v_adj.adjustment_number || ': ' || CASE WHEN p_approved THEN 'APPROUVÉE' ELSE 'REFUSÉE' END
    );

    RETURN jsonb_build_object('success', true, 'status', CASE WHEN p_approved THEN 'APPROVED' ELSE 'REJECTED' END);
END;
$$;
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
-- ============================================================================
-- MAHER STOCK - COMPLEXE MAHER RESTAURANT ET PISCINE
-- Schema Migration 004: Seed Data (Roles, Departments, Categories, Settings)
-- ============================================================================

-- 1. ROLES
INSERT INTO public.roles (id, name_fr, name_ar, description_fr, description_ar) VALUES
('ADMIN', 'Administrateur', 'مدير النظام', 'Propriétaire du restaurant - Tous les droits', 'مالك المطعم - كامل الصلاحيات'),
('RESPONSABLE', 'Responsable Économat', 'مسؤول المخزن', 'Gestionnaire de la chambre économat - Réceptions, remises et inventaires', 'مدير غرفة التموين - الاستلام والتسليم والجرد'),
('EMPLOYEE', 'Employé', 'موظف', 'Personnel des services - Demandes de sortie et consultation', 'موظف الأقسام - طلبات الصرف والمتابعة')
ON CONFLICT (id) DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    description_fr = EXCLUDED.description_fr,
    description_ar = EXCLUDED.description_ar;

-- 2. DEPARTMENTS
INSERT INTO public.departments (id, name_fr, name_ar, icon) VALUES
('Cuisine', 'Cuisine', 'المطبخ', 'Utensils'),
('Cafe', 'Café', 'المقهى', 'Coffee'),
('Restaurant', 'Restaurant / Salle', 'المطعم / الصالة', 'Wine'),
('Piscine', 'Piscine', 'المسبح', 'Waves'),
('Entretien', 'Entretien & Nettoyage', 'الصيانة والنظافة', 'Sparkles'),
('Autre', 'Autre Service', 'خدمات أخرى', 'Folder')
ON CONFLICT (id) DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    icon = EXCLUDED.icon;

-- 3. CATEGORIES
INSERT INTO public.categories (code, name_fr, name_ar, description, color, icon) VALUES
('ALIM', 'Produits alimentaires', 'المواد الغذائية', 'Épicerie, farines, sucres, huiles, féculents', '#E99B39', 'Wheat'),
('CAFE_BOISSON', 'Café et boissons', 'القهوة والمشروبات', 'Grains de café, thés, sirops, jus, eaux', '#78350F', 'Coffee'),
('CUISINE', 'Produits de cuisine', 'مستلزمات المطبخ', 'Condiments, épices, conserves, sauces professionnelles', '#DC2626', 'ChefHat'),
('PAPIER_CONS', 'Papier et consommables', 'الورقيات والمستهلكات', 'Serviettes, essuie-tout, rouleaux thermiques, pailles', '#43A9B7', 'FileText'),
('ENTRETIEN', 'Produits d''entretien', 'مواد التنظيف', 'Détergents, désinfectants sol, savons vaisselle, chlore piscine', '#0284C7', 'Sparkles'),
('EMBALLAGE', 'Emballages', 'مواد التغليف', 'Boîtes à emporter, barquettes, sacs kraft, film étirable', '#854D0E', 'Package'),
('AUTRES', 'Autres & Divers', 'أخرى ومتنوعة', 'Fournitures diverses et petit matériel', '#6B7280', 'MoreHorizontal')
ON CONFLICT (code) DO NOTHING;

-- 4. DEFAULT SETTINGS
INSERT INTO public.settings (key, value, description) VALUES
('establishment', jsonb_build_object(
    'name', 'COMPLEXE MAHER – RESTAURANT ET PISCINE',
    'app_name', 'MAHER STOCK',
    'subtitle', 'Gestion intelligente de l''économat',
    'currency', 'MAD',
    'phone', '+212 5 22 00 00 00',
    'city', 'Casablanca',
    'country', 'Maroc'
), 'Informations générales de l''établissement Complexe Maher'),
('security_rules', jsonb_build_object(
    'require_manager_pin', false,
    'allow_partial_deliveries', true,
    'block_negative_stock', true,
    'auto_reserve_on_approval', true
), 'Règles strictes de gestion et sécurité des stocks')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. SAMPLE SUPPLIERS (Initial setup)
INSERT INTO public.suppliers (name, phone, email, address, city, notes) VALUES
('Maroc Distribution Alimentaire', '+212 5 22 12 34 56', 'contact@marocdistribution.ma', 'Zone Industrielle Sidi Bernoussi', 'Casablanca', 'Fournisseur principal épicerie et huiles'),
('Cafés de Fès Torréfaction', '+212 5 35 65 43 21', 'commandes@cafesfes.ma', 'Quartier Industriel', 'Fès', 'Fournisseur grains de café arabica/robusta'),
('Hygiène & Propreté SARL', '+212 5 22 98 76 54', 'info@hygiene-pro.ma', 'Bd Mohammed VI', 'Casablanca', 'Détergents et produits de traitement piscine')
ON CONFLICT DO NOTHING;
