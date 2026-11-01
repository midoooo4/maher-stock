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
