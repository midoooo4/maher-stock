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
