import { 
  Product, 
  Category, 
  Supplier, 
  StockEntry, 
  StockRequest, 
  StockRequestItem, 
  StockMovement, 
  InventorySession, 
  InventoryItem, 
  StockAdjustment, 
  Notification, 
  AuditLog, 
  RoleType 
} from '../supabase/types';
import { supabase } from '../supabase/client';

function safeSupabaseSync(task: PromiseLike<any> | Promise<any>) {
  Promise.resolve(task).catch((err) => {
    console.warn('Supabase sync note:', err);
  });
}

const STORAGE_KEY = 'maher_stock_database_v1';

// Initial realistic categories
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-alim', code: 'ALIM', name_fr: 'Produits alimentaires', name_ar: 'المواد الغذائية', color: '#E99B39', icon: 'Wheat', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-cafe', code: 'CAFE_BOISSON', name_fr: 'Café et boissons', name_ar: 'القهوة والمشروبات', color: '#78350F', icon: 'Coffee', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-cuisine', code: 'CUISINE', name_fr: 'Produits de cuisine', name_ar: 'مستلزمات المطبخ', color: '#DC2626', icon: 'ChefHat', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-papier', code: 'PAPIER_CONS', name_fr: 'Papier et consommables', name_ar: 'الورقيات والمستهلكات', color: '#43A9B7', icon: 'FileText', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-entretien', code: 'ENTRETIEN', name_fr: 'Produits d\'entretien', name_ar: 'مواد التنظيف', color: '#0284C7', icon: 'Sparkles', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-emballage', code: 'EMBALLAGE', name_fr: 'Emballages', name_ar: 'مواد التغليف', color: '#854D0E', icon: 'Package', is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-autres', code: 'AUTRES', name_fr: 'Autres & Divers', name_ar: 'أخرى ومتنوعة', color: '#6B7280', icon: 'MoreHorizontal', is_active: true, created_at: new Date().toISOString() },
];

// Initial realistic suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Maroc Distribution Alimentaire', phone: '+212 5 22 12 34 56', email: 'contact@marocdistribution.ma', address: 'Zone Industrielle Sidi Bernoussi', city: 'Casablanca', notes: 'Fournisseur principal épicerie et huiles', is_active: true, created_at: new Date().toISOString() },
  { id: 'sup-2', name: 'Cafés Torréfaction Atlas', phone: '+212 5 35 65 43 21', email: 'commandes@atlascafe.ma', address: 'Quartier Industriel Ain Sebaa', city: 'Casablanca', notes: 'Fournisseur grains de café arabica/robusta', is_active: true, created_at: new Date().toISOString() },
  { id: 'sup-3', name: 'Hygiène & Piscine Pro Maroc', phone: '+212 5 22 98 76 54', email: 'info@hygiene-piscine.ma', address: 'Bd Mohammed VI', city: 'Casablanca', notes: 'Détergents, traitement eau piscine, chlore', is_active: true, created_at: new Date().toISOString() },
];

// Initial realistic restaurant & pool stock items
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-cafe',
    code: 'PRD-CAF-001',
    name_fr: 'Café Grains Torréfié Premium',
    name_ar: 'حبوب قهوة محمصة ممتازة',
    description: 'Mélange 80% Arabica 20% Robusta pour machines espresso professionnelles',
    category_id: 'cat-cafe',
    unit: 'kg',
    physical_stock: 25.0,
    reserved_stock: 0.0,
    min_stock: 10.0,
    purchase_price: 140.0,
    supplier_id: 'sup-2',
    location: 'Chambre Économat - Rayon C-1',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80',
    qr_code_data: 'MAHER-PRD-CAF-001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-sucre',
    code: 'PRD-SUC-002',
    name_fr: 'Sucre Semoule Sac 5kg',
    name_ar: 'سكر سنيدة كيس 5 كغ',
    description: 'Sucre blanc fin pour cuisine, pâtisserie et café',
    category_id: 'cat-alim',
    unit: 'kg',
    physical_stock: 45.0,
    reserved_stock: 0.0,
    min_stock: 20.0,
    purchase_price: 7.5,
    supplier_id: 'sup-1',
    location: 'Chambre Économat - Rayon A-2',
    image_url: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&q=80',
    qr_code_data: 'MAHER-PRD-SUC-002',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-huile',
    code: 'PRD-HUI-003',
    name_fr: 'Huile de Tournesol Bidon 5L',
    name_ar: 'زيت دوار الشمس سعة 5 لتر',
    description: 'Huile de friture et de cuisson haute température',
    category_id: 'cat-alim',
    unit: 'l',
    physical_stock: 30.0,
    reserved_stock: 0.0,
    min_stock: 15.0,
    purchase_price: 18.0,
    supplier_id: 'sup-1',
    location: 'Chambre Économat - Rayon A-1 (Sol)',
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
    qr_code_data: 'MAHER-PRD-HUI-003',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-farine',
    code: 'PRD-FAR-004',
    name_fr: 'Farine Pâtissière Sac 10kg',
    name_ar: 'دقيق ممتاز كيس 10 كغ',
    description: 'Farine de blé tendre extra raffinée pour pâtes fraîches et pâtisserie',
    category_id: 'cat-alim',
    unit: 'kg',
    physical_stock: 50.0,
    reserved_stock: 0.0,
    min_stock: 20.0,
    purchase_price: 6.0,
    supplier_id: 'sup-1',
    location: 'Chambre Économat - Rayon A-3',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    qr_code_data: 'MAHER-PRD-FAR-004',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-chlore',
    code: 'PRD-CHL-005',
    name_fr: 'Chlore Choc Galets Piscine 5kg',
    name_ar: 'أقراص كلور صدمة للمسبح 5 كغ',
    description: 'Désinfectant et assainissant eau de piscine complexe',
    category_id: 'cat-entretien',
    unit: 'kg',
    physical_stock: 15.0,
    reserved_stock: 0.0,
    min_stock: 8.0,
    purchase_price: 65.0,
    supplier_id: 'sup-3',
    location: 'Local Technique Piscine / Entretien',
    image_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&q=80',
    qr_code_data: 'MAHER-PRD-CHL-005',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-serviette',
    code: 'PRD-SER-006',
    name_fr: 'Serviettes Papier Cocktail (Carton 2000)',
    name_ar: 'مناديل ورقية كوكتيل كرتونة 2000',
    description: 'Serviettes blanches gaufrées pour bar de la piscine et restaurant',
    category_id: 'cat-papier',
    unit: 'carton',
    physical_stock: 8.0,
    reserved_stock: 0.0,
    min_stock: 4.0,
    purchase_price: 95.0,
    supplier_id: 'sup-3',
    location: 'Chambre Économat - Rayon D-2',
    image_url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80',
    qr_code_data: 'MAHER-PRD-SER-006',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-detergent',
    code: 'PRD-DET-007',
    name_fr: 'Détergent Sols & Surfaces 5L',
    name_ar: 'منظف ومطهر الأرضيات والأسطح 5 لتر',
    description: 'Produit désinfectant normes HACCP pour sols salle et cuisine',
    category_id: 'cat-entretien',
    unit: 'l',
    physical_stock: 12.0,
    reserved_stock: 0.0,
    min_stock: 5.0,
    purchase_price: 42.0,
    supplier_id: 'sup-3',
    location: 'Chambre Économat - Rayon E-1',
    image_url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80',
    qr_code_data: 'MAHER-PRD-DET-007',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-eau',
    code: 'PRD-EAU-008',
    name_fr: 'Eau Minérale Naturelle 1.5L (Pack 6)',
    name_ar: 'ماء معدني طبيعي 1.5 لتر حزمة 6',
    description: 'Packs eau minérale pour service table et bar piscine',
    category_id: 'cat-cafe',
    unit: 'paquet',
    physical_stock: 35.0,
    reserved_stock: 0.0,
    min_stock: 15.0,
    purchase_price: 24.0,
    supplier_id: 'sup-1',
    location: 'Chambre Économat - Rayon B-1',
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&q=80',
    qr_code_data: 'MAHER-PRD-EAU-008',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-lait',
    code: 'PRD-LAI-009',
    name_fr: 'Lait Entier UHT Brique 1L Pack 12',
    name_ar: 'حليب كامل الدسم 1 لتر حزمة 12',
    description: 'Lait entier pasteurisé pour préparations café, cappuccino et cuisine',
    category_id: 'cat-alim',
    unit: 'paquet',
    physical_stock: 20.0,
    reserved_stock: 0.0,
    min_stock: 8.0,
    purchase_price: 110.0,
    supplier_id: 'sup-1',
    location: 'Chambre Froide Positive',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80',
    qr_code_data: 'MAHER-PRD-LAI-009',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-the',
    code: 'PRD-THE-010',
    name_fr: 'Thé Vert Gunpowder Traditionnel 1kg',
    name_ar: 'شاي أخضر صيني بارود ممتاز 1 كغ',
    description: 'Grains de thé vert de premier choix pour thé à la menthe marocain',
    category_id: 'cat-cafe',
    unit: 'kg',
    physical_stock: 16.0,
    reserved_stock: 0.0,
    min_stock: 6.0,
    purchase_price: 75.0,
    supplier_id: 'sup-2',
    location: 'Chambre Économat - Rayon C-2',
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
    qr_code_data: 'MAHER-PRD-THE-010',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-riz',
    code: 'PRD-RIZ-011',
    name_fr: 'Riz Basmati Extra Long Grain Sac 5kg',
    name_ar: 'أرز بسمتي حبة طويلة كيس 5 كغ',
    description: 'Riz supérieur pour garnitures plats chauds restaurant et banquet',
    category_id: 'cat-alim',
    unit: 'kg',
    physical_stock: 25.0,
    reserved_stock: 0.0,
    min_stock: 10.0,
    purchase_price: 18.5,
    supplier_id: 'sup-1',
    location: 'Chambre Économat - Rayon A-4',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
    qr_code_data: 'MAHER-PRD-RIZ-011',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-tomate',
    code: 'PRD-TOM-012',
    name_fr: 'Double Concentré de Tomates Boîte 800g',
    name_ar: 'معجون طماطم مركز علبة 800 غ',
    description: 'Sauces de base, tajines, pizzas et plats méditerranéens',
    category_id: 'cat-cuisine',
    unit: 'piece',
    physical_stock: 40.0,
    reserved_stock: 0.0,
    min_stock: 15.0,
    purchase_price: 14.0,
    supplier_id: 'sup-1',
    location: 'Chambre Économat - Rayon B-3',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80',
    qr_code_data: 'MAHER-PRD-TOM-012',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-savon',
    code: 'PRD-SAV-013',
    name_fr: 'Savon Liquide Mains Antibactérien Bidon 5L',
    name_ar: 'صابون سائل للأيدي مضاد للبكتيريا 5 لتر',
    description: 'Recharge distributeurs sanitaires restaurant, vestiaires et piscine',
    category_id: 'cat-entretien',
    unit: 'l',
    physical_stock: 10.0,
    reserved_stock: 0.0,
    min_stock: 4.0,
    purchase_price: 38.0,
    supplier_id: 'sup-3',
    location: 'Chambre Économat - Rayon E-2',
    image_url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&q=80',
    qr_code_data: 'MAHER-PRD-SAV-013',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-barquette',
    code: 'PRD-BAR-014',
    name_fr: 'Barquettes Alimentaires Kraft Emporter x100',
    name_ar: 'علب طعام كرافت للوجبات السريعة 100 حبة',
    description: 'Emballages recyclables pour snacks piscine et plats à emporter',
    category_id: 'cat-emballage',
    unit: 'paquet',
    physical_stock: 12.0,
    reserved_stock: 0.0,
    min_stock: 5.0,
    purchase_price: 85.0,
    supplier_id: 'sup-3',
    location: 'Chambre Économat - Rayon F-1',
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&q=80',
    qr_code_data: 'MAHER-PRD-BAR-014',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-film',
    code: 'PRD-FIL-015',
    name_fr: 'Film Étirable Alimentaire Pro Rouleau 300m',
    name_ar: 'غشاء بلاستيكي غذائي احترافي رول 300 متر',
    description: 'Film de conservation étanche pour chambre froide cuisine',
    category_id: 'cat-emballage',
    unit: 'piece',
    physical_stock: 15.0,
    reserved_stock: 0.0,
    min_stock: 6.0,
    purchase_price: 45.0,
    supplier_id: 'sup-3',
    location: 'Chambre Économat - Rayon F-2',
    image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&q=80',
    qr_code_data: 'MAHER-PRD-FIL-015',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export interface DatabaseState {
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  stock_entries: StockEntry[];
  stock_requests: StockRequest[];
  stock_movements: StockMovement[];
  inventory_sessions: InventorySession[];
  stock_adjustments: StockAdjustment[];
  notifications: Notification[];
  audit_logs: AuditLog[];
}

function getInitialState(): DatabaseState {
  return {
    categories: INITIAL_CATEGORIES,
    suppliers: INITIAL_SUPPLIERS,
    products: INITIAL_PRODUCTS,
    stock_entries: [],
    stock_requests: [],
    stock_movements: [],
    inventory_sessions: [],
    stock_adjustments: [],
    notifications: [],
    audit_logs: [],
  };
}

class StockDatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      this.load();
      Promise.resolve(this.syncWithSupabase()).catch(() => {});
    }
  }

  private load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.state = JSON.parse(data);
        // Ensure all initial products exist in state
        if (!this.state.products || this.state.products.length < INITIAL_PRODUCTS.length) {
          const existingCodes = new Set((this.state.products || []).map(p => p.code));
          INITIAL_PRODUCTS.forEach(ip => {
            if (!existingCodes.has(ip.code)) {
              this.state.products.push(ip);
            }
          });
          this.save();
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('Could not parse localStorage database, resetting to initial state', e);
      this.state = getInitialState();
      this.save();
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        window.dispatchEvent(new CustomEvent('maher_stock_updated'));
      } catch (e) {
        console.error('Error saving stock state to localStorage', e);
      }
    }
  }

  public async syncWithSupabase() {
    if (typeof window === 'undefined') return;
    try {
      const [prodsRes, reqsRes, supsRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('stock_requests').select('*, items:stock_request_items(*)'),
        supabase.from('suppliers').select('*'),
      ]);

      let changed = false;

      if (prodsRes.data && prodsRes.data.length > 0) {
        // Merge Supabase products
        const supProds = prodsRes.data as Product[];
        const prodMap = new Map(this.state.products.map(p => [p.code, p]));
        supProds.forEach(sp => {
          prodMap.set(sp.code, { ...prodMap.get(sp.code), ...sp });
        });
        this.state.products = Array.from(prodMap.values());
        changed = true;
      }

      if (supsRes.data && supsRes.data.length > 0) {
        this.state.suppliers = supsRes.data as Supplier[];
        changed = true;
      }

      if (reqsRes.data && reqsRes.data.length > 0) {
        // Merge Supabase stock requests
        const reqMap = new Map(this.state.stock_requests.map(r => [r.request_number, r]));
        reqsRes.data.forEach((sr: any) => {
          const existing = reqMap.get(sr.request_number);
          if (!existing) {
            this.state.stock_requests.unshift(sr);
            changed = true;
          } else if (existing.status !== sr.status) {
            existing.status = sr.status;
            existing.approved_by = sr.approved_by;
            existing.approved_at = sr.approved_at;
            existing.rejected_by = sr.rejected_by;
            existing.rejected_at = sr.rejected_at;
            existing.rejection_reason = sr.rejection_reason;
            existing.delivered_by = sr.delivered_by;
            existing.delivered_at = sr.delivered_at;
            changed = true;
          }
        });
      }

      if (changed) {
        this.save();
      }
    } catch (err) {
      console.warn('Supabase sync note:', err);
    }
  }

  // --- QUERY METHODS ---

  public getProducts(): Product[] {
    this.load();
    return this.state.products.map(p => ({
      ...p,
      category: this.state.categories.find(c => c.id === p.category_id),
      supplier: this.state.suppliers.find(s => s.id === p.supplier_id),
    }));
  }

  public getProductById(id: string): Product | undefined {
    this.load();
    const prod = this.state.products.find(p => p.id === id || p.code === id || p.qr_code_data === id);
    if (!prod) return undefined;
    return {
      ...prod,
      category: this.state.categories.find(c => c.id === prod.category_id),
      supplier: this.state.suppliers.find(s => s.id === prod.supplier_id),
    };
  }

  public getCategories(): Category[] {
    this.load();
    return this.state.categories;
  }

  public getSuppliers(): Supplier[] {
    this.load();
    return this.state.suppliers;
  }

  public saveSupplier(supplierData: Partial<Supplier>, userId?: string, userName?: string, userRole?: RoleType): Supplier {
    this.load();
    if (supplierData.id) {
      const idx = this.state.suppliers.findIndex(s => s.id === supplierData.id);
      if (idx !== -1) {
        this.state.suppliers[idx] = {
          ...this.state.suppliers[idx],
          ...supplierData,
        };
        this.save();
        safeSupabaseSync(
          supabase.from('suppliers').update({
            name: supplierData.name,
            phone: supplierData.phone,
            email: supplierData.email,
            address: supplierData.address,
            city: supplierData.city,
            notes: supplierData.notes,
          }).eq('id', supplierData.id)
        );
        return this.state.suppliers[idx];
      }
    }

    const newSup: Supplier = {
      id: supplierData.id || `sup-${Date.now()}`,
      name: supplierData.name || 'Nouveau Fournisseur',
      phone: supplierData.phone,
      email: supplierData.email,
      address: supplierData.address,
      city: supplierData.city || 'Casablanca',
      notes: supplierData.notes,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    this.state.suppliers.push(newSup);
    this.save();

    safeSupabaseSync(
      supabase.from('suppliers').insert([{
        name: newSup.name,
        phone: newSup.phone,
        email: newSup.email,
        address: newSup.address,
        city: newSup.city,
        notes: newSup.notes,
        is_active: true,
      }])
    );

    return newSup;
  }

  public deleteSupplier(id: string): void {
    this.load();
    this.state.suppliers = this.state.suppliers.filter(s => s.id !== id);
    this.save();
    safeSupabaseSync(
      supabase.from('suppliers').delete().eq('id', id)
    );
  }

  public getStockEntries(): StockEntry[] {
    this.load();
    return this.state.stock_entries.map(e => ({
      ...e,
      product: this.getProductById(e.product_id),
      supplier: this.state.suppliers.find(s => s.id === e.supplier_id),
    }));
  }

  public getStockRequests(): StockRequest[] {
    this.load();
    return this.state.stock_requests.map(r => ({
      ...r,
      items: r.items?.map(item => ({
        ...item,
        product: this.getProductById(item.product_id),
      })),
    }));
  }

  public getStockMovements(): StockMovement[] {
    this.load();
    return this.state.stock_movements.map(m => ({
      ...m,
      product: this.getProductById(m.product_id),
    }));
  }

  public getInventorySessions(): InventorySession[] {
    this.load();
    return this.state.inventory_sessions;
  }

  public getStockAdjustments(): StockAdjustment[] {
    this.load();
    return this.state.stock_adjustments.map(a => ({
      ...a,
      product: this.getProductById(a.product_id),
    }));
  }

  public getNotifications(role?: RoleType, userId?: string): Notification[] {
    this.load();
    return this.state.notifications.filter(n => {
      if (n.recipient_id && userId && n.recipient_id === userId) return true;
      if (n.recipient_role && (n.recipient_role === role || n.recipient_role === 'ALL')) return true;
      return !n.recipient_id && !n.recipient_role;
    });
  }

  public getAuditLogs(): AuditLog[] {
    this.load();
    return this.state.audit_logs;
  }

  // --- MUTATION METHODS (STRICT BUSINESS LOGIC) ---

  // 1. ADD / EDIT PRODUCT
  public saveProduct(productData: Partial<Product>, userId: string, userName: string, userRole: RoleType): Product {
    this.load();
    if (userRole === 'EMPLOYEE') {
      throw new Error('Accès refusé: Un employé ne peut pas créer ou modifier de produit.');
    }

    if (productData.id) {
      // Edit
      const index = this.state.products.findIndex(p => p.id === productData.id);
      if (index === -1) throw new Error('Produit introuvable.');
      const old = this.state.products[index];
      const updated: Product = {
        ...old,
        ...productData,
        physical_stock: old.physical_stock, // Physical stock cannot be edited directly via product form!
        reserved_stock: old.reserved_stock,
        updated_at: new Date().toISOString(),
      };
      this.state.products[index] = updated;

      this.addAuditLog({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        action: 'PRODUCT_UPDATE',
        entity_type: 'products',
        entity_id: updated.id,
        old_values: old as unknown as Record<string, unknown>,
        new_values: updated as unknown as Record<string, unknown>,
        notes: `Modification du produit ${updated.name_fr} (${updated.code})`,
      });

      this.save();
      if (typeof window !== 'undefined') {
        safeSupabaseSync(
          supabase.from('products').upsert([{
            code: updated.code,
            name_fr: updated.name_fr,
            name_ar: updated.name_ar,
            description: updated.description,
            unit: updated.unit,
            purchase_price: updated.purchase_price,
            min_stock: updated.min_stock,
            location: updated.location,
            image_url: updated.image_url,
            is_active: updated.is_active,
          }], { onConflict: 'code' })
        );
      }
      return updated;
    } else {
      // Create new
      const code = productData.code || `PRD-${Date.now().toString().slice(-4)}`;
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        code,
        name_fr: productData.name_fr || 'Nouveau Produit',
        name_ar: productData.name_ar || 'منتج جديد',
        description: productData.description || '',
        category_id: productData.category_id || this.state.categories[0].id,
        unit: productData.unit || 'kg',
        physical_stock: 0,
        reserved_stock: 0,
        min_stock: productData.min_stock || 5,
        purchase_price: productData.purchase_price || 0,
        supplier_id: productData.supplier_id,
        location: productData.location || '',
        image_url: productData.image_url,
        qr_code_data: `MAHER-${code}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.state.products.push(newProduct);

      this.addAuditLog({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        action: 'PRODUCT_CREATE',
        entity_type: 'products',
        entity_id: newProduct.id,
        new_values: newProduct as unknown as Record<string, unknown>,
        notes: `Création du produit ${newProduct.name_fr} (${newProduct.code})`,
      });

      this.save();
      if (typeof window !== 'undefined') {
        safeSupabaseSync(
          supabase.from('products').upsert([{
            code: newProduct.code,
            name_fr: newProduct.name_fr,
            name_ar: newProduct.name_ar,
            description: newProduct.description,
            unit: newProduct.unit,
            purchase_price: newProduct.purchase_price,
            min_stock: newProduct.min_stock,
            location: newProduct.location,
            image_url: newProduct.image_url,
            is_active: newProduct.is_active,
          }], { onConflict: 'code' })
        );
      }
      return newProduct;
    }
  }

  // 2. RECEIVE STOCK (RÉCEPTION LIVRAISON)
  public receiveStock(params: {
    productId: string;
    quantity: number;
    unitPrice: number;
    supplierId?: string;
    invoiceNumber?: string;
    invoicePhotoUrl?: string;
    notes?: string;
    userId: string;
    userName: string;
    userRole: RoleType;
  }): StockEntry {
    this.load();
    const { productId, quantity, unitPrice, supplierId, invoiceNumber, invoicePhotoUrl, notes, userId, userName, userRole } = params;

    if (userRole === 'EMPLOYEE') {
      throw new Error('Accès refusé: Un employé ne peut pas enregistrer de livraison.');
    }

    if (quantity <= 0) {
      throw new Error('La quantité reçue doit être strictement positive.');
    }

    const product = this.state.products.find(p => p.id === productId);
    if (!product) throw new Error('Produit introuvable.');

    const oldPhysicalStock = product.physical_stock;
    const oldPrice = product.purchase_price;

    // Calculate Weighted Average Cost (PMP)
    const newStock = oldPhysicalStock + quantity;
    const newPmp = newStock > 0 ? Number((((oldPhysicalStock * oldPrice) + (quantity * unitPrice)) / newStock).toFixed(2)) : unitPrice;

    // Update Product Stock & PMP
    product.physical_stock = newStock;
    product.purchase_price = newPmp;
    product.updated_at = new Date().toISOString();

    const entryNumber = `ENT-${new Date().getFullYear()}-${String(this.state.stock_entries.length + 1).padStart(4, '0')}`;
    const newEntry: StockEntry = {
      id: `ent-${Date.now()}`,
      entry_number: entryNumber,
      product_id: productId,
      quantity,
      unit_price: unitPrice,
      total_price: Number((quantity * unitPrice).toFixed(2)),
      supplier_id: supplierId,
      invoice_number: invoiceNumber,
      invoice_photo_url: invoicePhotoUrl,
      received_by: userId,
      received_at: new Date().toISOString(),
      notes,
      created_at: new Date().toISOString(),
    };
    this.state.stock_entries.unshift(newEntry);

    // Record Stock Movement ENTRY
    const movementNumber = `MOUV-${new Date().getFullYear()}-${String(this.state.stock_movements.length + 1).padStart(4, '0')}`;
    const newMovement: StockMovement = {
      id: `mouv-${Date.now()}`,
      movement_number: movementNumber,
      product_id: productId,
      movement_type: 'ENTRY',
      quantity,
      stock_before: oldPhysicalStock,
      stock_after: newStock,
      unit_cost: unitPrice,
      total_cost: Number((quantity * unitPrice).toFixed(2)),
      reference_type: 'ENTRY',
      reference_id: newEntry.id,
      performed_by: userId,
      notes: `Livraison ${entryNumber} de ${quantity} ${product.unit}`,
      created_at: new Date().toISOString(),
    };
    this.state.stock_movements.unshift(newMovement);

    // Audit Log
    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'STOCK_ENTRY',
      entity_type: 'stock_entries',
      entity_id: newEntry.id,
      old_values: { physical_stock: oldPhysicalStock, purchase_price: oldPrice },
      new_values: { physical_stock: newStock, purchase_price: newPmp, quantity },
      notes: `Réception marchandise ${entryNumber}: ${product.name_fr} (+${quantity} ${product.unit})`,
    });

    // Notify Admin
    this.addNotification({
      recipient_role: 'ADMIN',
      title_fr: `Nouvelle livraison reçue (${entryNumber})`,
      title_ar: `شحنة بضائع جديدة مستلمة (${entryNumber})`,
      message_fr: `Réception de ${quantity} ${product.unit} de ${product.name_fr} par ${userName}`,
      message_ar: `تم استلام ${quantity} ${product.unit} من ${product.name_ar} بواسطة ${userName}`,
      type: 'NEW_ENTRY',
      reference_type: 'stock_entries',
      reference_id: newEntry.id,
    });

    this.save();
    return newEntry;
  }

  // 3. CREATE STOCK REQUEST (PAR L'EMPLOYÉ)
  public createStockRequest(params: {
    employeeId: string;
    employeeName: string;
    department: string;
    items: { productId: string; quantity: number }[];
    reason: string;
    notes?: string;
  }): StockRequest {
    this.load();
    const { employeeId, department, items, reason, notes } = params;

    if (!items || items.length === 0) {
      throw new Error('Une demande doit contenir au moins un article.');
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error('Chaque quantité demandée doit être strictement supérieure à 0.');
      }
      const prod = this.state.products.find(p => p.id === item.productId);
      if (!prod) throw new Error(`Produit introuvable.`);
    }

    const requestNumber = `DEM-${new Date().getFullYear()}-${String(this.state.stock_requests.length + 1).padStart(4, '0')}`;
    const requestId = `req-${Date.now()}`;

    const requestItems: StockRequestItem[] = items.map((it, idx) => {
      const prod = this.state.products.find(p => p.id === it.productId)!;
      return {
        id: `item-${Date.now()}-${idx}`,
        request_id: requestId,
        product_id: it.productId,
        requested_quantity: it.quantity,
        approved_quantity: null,
        delivered_quantity: null,
        unit: prod.unit,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
    });

    const newRequest: StockRequest = {
      id: requestId,
      request_number: requestNumber,
      employee_id: employeeId,
      department,
      status: 'PENDING',
      reason,
      notes,
      items: requestItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.stock_requests.unshift(newRequest);

    // Audit log
    this.addAuditLog({
      user_id: employeeId,
      user_name: params.employeeName,
      user_role: 'EMPLOYEE',
      action: 'REQUEST_CREATE',
      entity_type: 'stock_requests',
      entity_id: requestId,
      new_values: { requestNumber, department, itemsCount: items.length },
      notes: `Nouvelle demande de sortie ${requestNumber} par ${params.employeeName} pour ${department}`,
    });

    // Notify Responsable Économat
    this.addNotification({
      recipient_role: 'RESPONSABLE',
      title_fr: `Nouvelle demande de sortie (${requestNumber})`,
      title_ar: `طلب صرف جديد (${requestNumber})`,
      message_fr: `Demande de ${params.employeeName} pour le service ${department} (${items.length} articles)`,
      message_ar: `طلب مقدم من ${params.employeeName} لصالح قسم ${department} (${items.length} مواد)`,
      type: 'NEW_REQUEST',
      reference_type: 'stock_requests',
      reference_id: requestId,
    });

    this.save();

    // Sync to Supabase in background
    if (typeof window !== 'undefined') {
      safeSupabaseSync(
        Promise.resolve(
          supabase.from('stock_requests').insert([{
            request_number: requestNumber,
            employee_id: employeeId,
            department,
            status: 'PENDING',
            reason,
            notes: notes || null
          }]).select()
        ).then(({ data, error }) => {
          if (!error && data && data[0]) {
            const reqDbId = (data[0] as any).id;
            const itemsPayload = requestItems.map(it => ({
              request_id: reqDbId,
              product_id: it.product_id,
              requested_quantity: it.requested_quantity,
              unit: it.unit,
              status: 'PENDING'
            }));
            safeSupabaseSync(supabase.from('stock_request_items').insert(itemsPayload));
          }
        })
      );
    }

    return newRequest;
  }

  // 4. APPROVE STOCK REQUEST (RÈGLE: RÉSERVE LE STOCK, NE LE SORT PAS ENCORE!)
  public approveStockRequest(params: {
    requestId: string;
    itemsApproved: { itemId: string; approvedQuantity: number }[];
    userId: string;
    userName: string;
    userRole: RoleType;
  }): StockRequest {
    this.load();
    const { requestId, itemsApproved, userId, userName, userRole } = params;

    if (userRole === 'EMPLOYEE') {
      throw new Error('Accès refusé: Un employé ne peut pas valider une demande.');
    }

    const request = this.state.stock_requests.find(r => r.id === requestId);
    if (!request) throw new Error('Demande introuvable.');

    // Règle 13: Un employé ne peut pas valider sa propre demande
    if (request.employee_id === userId) {
      throw new Error('Règle de sécurité: Vous ne pouvez pas valider votre propre demande.');
    }

    if (request.status !== 'PENDING') {
      throw new Error(`Impossible de valider: la demande est déjà au statut ${request.status}.`);
    }

    for (const appItem of itemsApproved) {
      const item = request.items?.find(it => it.id === appItem.itemId);
      if (!item) throw new Error('Article de demande introuvable.');

      const product = this.state.products.find(p => p.id === item.product_id);
      if (!product) throw new Error('Produit introuvable.');

      const availableStock = product.physical_stock - product.reserved_stock;
      if (appItem.approvedQuantity > availableStock) {
        throw new Error(
          `Stock disponible insuffisant pour "${product.name_fr}". Demandé/Approuvé: ${appItem.approvedQuantity} ${product.unit}, Disponible: ${availableStock} ${product.unit}.`
        );
      }

      item.approved_quantity = appItem.approvedQuantity;
      item.status = appItem.approvedQuantity > 0 ? 'APPROVED' : 'REJECTED';

      // Reserve stock in product (RÈGLE MÉTIER: Le stock n'est pas diminué, il est réservé!)
      product.reserved_stock += appItem.approvedQuantity;
      product.updated_at = new Date().toISOString();
    }

    request.status = 'APPROVED';
    request.approved_by = userId;
    request.approved_at = new Date().toISOString();
    request.updated_at = new Date().toISOString();

    // Audit Log
    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'REQUEST_APPROVE',
      entity_type: 'stock_requests',
      entity_id: requestId,
      old_values: { status: 'PENDING' },
      new_values: { status: 'APPROVED', itemsApproved },
      notes: `Demande ${request.request_number} validée par ${userName}. Stock réservé.`,
    });

    // Notify requesting Employee
    this.addNotification({
      recipient_id: request.employee_id,
      title_fr: `Demande approuvée (${request.request_number})`,
      title_ar: `تمت الموافقة على طلبك (${request.request_number})`,
      message_fr: `Votre demande a été approuvée par le responsable. Préparation en cours.`,
      message_ar: `تمت الموافقة على طلبك بنجاح من طرف المسؤول. جاري التحضير.`,
      type: 'REQUEST_APPROVED',
      reference_type: 'stock_requests',
      reference_id: requestId,
    });

    this.save();
    if (typeof window !== 'undefined') {
      safeSupabaseSync(
        supabase.from('stock_requests').update({
          status: 'APPROVED',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        }).eq('request_number', request.request_number)
      );
    }
    return request;
  }

  // 5. REJECT STOCK REQUEST
  public rejectStockRequest(params: {
    requestId: string;
    reason: string;
    userId: string;
    userName: string;
    userRole: RoleType;
  }): StockRequest {
    this.load();
    const { requestId, reason, userId, userName, userRole } = params;

    if (userRole === 'EMPLOYEE') {
      throw new Error('Accès refusé.');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Un motif de refus est obligatoire.');
    }

    const request = this.state.stock_requests.find(r => r.id === requestId);
    if (!request) throw new Error('Demande introuvable.');

    if (request.status !== 'PENDING') {
      throw new Error(`Impossible de refuser: statut actuel ${request.status}.`);
    }

    request.status = 'REJECTED';
    request.rejection_reason = reason;
    request.rejected_by = userId;
    request.rejected_at = new Date().toISOString();
    request.updated_at = new Date().toISOString();

    request.items?.forEach(it => {
      it.status = 'REJECTED';
    });

    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'REQUEST_REJECT',
      entity_type: 'stock_requests',
      entity_id: requestId,
      old_values: { status: 'PENDING' },
      new_values: { status: 'REJECTED', reason },
      notes: `Demande ${request.request_number} refusée: ${reason}`,
    });

    this.addNotification({
      recipient_id: request.employee_id,
      title_fr: `Demande refusée (${request.request_number})`,
      title_ar: `تم رفض الطلب (${request.request_number})`,
      message_fr: `Votre demande a été refusée. Motif : ${reason}`,
      message_ar: `تم رفض طلبك. السبب : ${reason}`,
      type: 'REQUEST_REJECTED',
      reference_type: 'stock_requests',
      reference_id: requestId,
    });

    this.save();
    if (typeof window !== 'undefined') {
      safeSupabaseSync(
        supabase.from('stock_requests').update({
          status: 'REJECTED',
          rejection_reason: reason,
          rejected_by: userId,
          rejected_at: new Date().toISOString(),
        }).eq('request_number', request.request_number)
      );
    }
    return request;
  }

  // 6. PREPARE STOCK REQUEST
  public prepareStockRequest(params: {
    requestId: string;
    userId: string;
    userName: string;
    userRole: RoleType;
  }): StockRequest {
    this.load();
    const { requestId, userId, userName, userRole } = params;

    const request = this.state.stock_requests.find(r => r.id === requestId);
    if (!request) throw new Error('Demande introuvable.');

    if (request.status !== 'APPROVED') {
      throw new Error('Seule une demande approuvée peut être préparée.');
    }

    request.status = 'READY';
    request.prepared_by = userId;
    request.prepared_at = new Date().toISOString();
    request.updated_at = new Date().toISOString();

    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'REQUEST_PREPARE',
      entity_type: 'stock_requests',
      entity_id: requestId,
      old_values: { status: 'APPROVED' },
      new_values: { status: 'READY' },
      notes: `Articles préparés pour la demande ${request.request_number}. Prêt pour remise.`,
    });

    this.addNotification({
      recipient_id: request.employee_id,
      title_fr: `Articles prêts à retirer (${request.request_number})`,
      title_ar: `المواد جاهزة للاستلام (${request.request_number})`,
      message_fr: `Vos produits sont préparés à l'économat. Merci de vous présenter pour la remise physique.`,
      message_ar: `أغراضك جاهزة في غرفة المخزن. يرجى التوجه للاستلام والتأكيد.`,
      type: 'REQUEST_READY',
      reference_type: 'stock_requests',
      reference_id: requestId,
    });

    this.save();
    if (typeof window !== 'undefined') {
      safeSupabaseSync(
        supabase.from('stock_requests').update({
          status: 'READY',
          prepared_by: userId,
          prepared_at: new Date().toISOString(),
        }).eq('request_number', request.request_number)
      );
    }
    return request;
  }

  // 7. CONFIRM PHYSICAL DELIVERY (CONFIRMER LA REMISE RÉELLE - DIMINUE LE STOCK ICI SEULEMENT)
  public deliverStockRequest(params: {
    requestId: string;
    deliveredItems: { itemId: string; deliveredQuantity: number }[];
    deliveryNotes?: string;
    userId: string;
    userName: string;
    userRole: RoleType;
    pinCode?: string;
  }): StockRequest {
    this.load();
    const { requestId, deliveredItems, deliveryNotes, userId, userName, userRole } = params;

    if (userRole === 'EMPLOYEE') {
      throw new Error('Accès refusé: Seul le responsable ou l\'administrateur peut confirmer la remise.');
    }

    const request = this.state.stock_requests.find(r => r.id === requestId);
    if (!request) throw new Error('Demande introuvable.');

    if (request.status !== 'APPROVED' && request.status !== 'READY') {
      throw new Error(`La remise ne peut être confirmée que pour une demande approuvée ou préparée (Statut: ${request.status}).`);
    }

    let isPartial = false;

    for (const delItem of deliveredItems) {
      const item = request.items?.find(it => it.id === delItem.itemId);
      if (!item) throw new Error('Article introuvable dans la demande.');

      const product = this.state.products.find(p => p.id === item.product_id);
      if (!product) throw new Error('Produit introuvable.');

      // Release reserved stock
      const approvedQty = item.approved_quantity ?? item.requested_quantity;
      product.reserved_stock = Math.max(0, product.reserved_stock - approvedQty);

      // Verify physical stock
      if (delItem.deliveredQuantity > product.physical_stock) {
        throw new Error(
          `Stock physique insuffisant pour ${product.name_fr}: En stock ${product.physical_stock}, voulu remettre ${delItem.deliveredQuantity}`
        );
      }

      const stockBefore = product.physical_stock;
      // DÉCRÉMENTATION EFFECTIVE DU STOCK PHYSIQUE
      product.physical_stock = Number((product.physical_stock - delItem.deliveredQuantity).toFixed(3));
      product.updated_at = new Date().toISOString();

      item.delivered_quantity = delItem.deliveredQuantity;
      item.status = 'DELIVERED';

      if (delItem.deliveredQuantity < approvedQty) {
        isPartial = true;
      }

      // Record Stock Movement EXIT
      if (delItem.deliveredQuantity > 0) {
        const movementNumber = `MOUV-${new Date().getFullYear()}-${String(this.state.stock_movements.length + 1).padStart(4, '0')}`;
        const movement: StockMovement = {
          id: `mouv-${Date.now()}-${item.id}`,
          movement_number: movementNumber,
          product_id: product.id,
          movement_type: 'EXIT',
          quantity: delItem.deliveredQuantity,
          stock_before: stockBefore,
          stock_after: product.physical_stock,
          unit_cost: product.purchase_price,
          total_cost: Number((delItem.deliveredQuantity * product.purchase_price).toFixed(2)),
          reference_type: 'REQUEST',
          reference_id: requestId,
          performed_by: userId,
          notes: `Sortie confirmée pour ${request.request_number} (${request.department})`,
          created_at: new Date().toISOString(),
        };
        this.state.stock_movements.unshift(movement);
      }

      // Check Low Stock Alert
      if ((product.physical_stock - product.reserved_stock) <= product.min_stock) {
        this.addNotification({
          recipient_role: 'RESPONSABLE',
          title_fr: `Alerte: Stock faible pour ${product.name_fr}`,
          title_ar: `تنبيه: مخزون منخفض لـ ${product.name_ar}`,
          message_fr: `Le stock disponible (${product.physical_stock - product.reserved_stock} ${product.unit}) est sous le seuil d'alerte (${product.min_stock} ${product.unit}).`,
          message_ar: `المخزون المتوفر (${product.physical_stock - product.reserved_stock} ${product.unit}) أقل من الحد الأدنى (${product.min_stock} ${product.unit}).`,
          type: 'LOW_STOCK',
          reference_type: 'products',
          reference_id: product.id,
        });
      }
    }

    request.status = isPartial ? 'PARTIALLY_DELIVERED' : 'DELIVERED';
    request.delivered_by = userId;
    request.delivered_at = new Date().toISOString();
    request.delivery_notes = deliveryNotes;
    request.updated_at = new Date().toISOString();

    // Audit Log
    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'REQUEST_DELIVER',
      entity_type: 'stock_requests',
      entity_id: requestId,
      old_values: { status: 'READY' },
      new_values: { status: request.status, deliveredItems },
      notes: `Remise physique effectuée pour ${request.request_number}. Stock physique diminué.`,
    });

    // Notify Employee
    this.addNotification({
      recipient_id: request.employee_id,
      title_fr: `Remise confirmée (${request.request_number})`,
      title_ar: `تم تأكيد التسليم (${request.request_number})`,
      message_fr: `Les produits vous ont été remis par ${userName}.`,
      message_ar: `تم تسليم المواد إليك بنجاح من طرف ${userName}.`,
      type: 'REQUEST_DELIVERED',
      reference_type: 'stock_requests',
      reference_id: requestId,
    });

    this.save();
    if (typeof window !== 'undefined') {
      safeSupabaseSync(
        supabase.from('stock_requests').update({
          status: 'DELIVERED',
          delivered_by: userId,
          delivered_at: new Date().toISOString(),
        }).eq('request_number', request.request_number)
      );
    }
    return request;
  }

  // 8. CANCEL STOCK REQUEST
  public cancelStockRequest(params: {
    requestId: string;
    userId: string;
    userName: string;
    userRole: RoleType;
    reason?: string;
  }): StockRequest {
    this.load();
    const { requestId, userId, userName, userRole, reason } = params;

    const request = this.state.stock_requests.find(r => r.id === requestId);
    if (!request) throw new Error('Demande introuvable.');

    if (userRole === 'EMPLOYEE' && request.employee_id !== userId) {
      throw new Error('Vous ne pouvez pas annuler la demande d\'un autre employé.');
    }

    if (userRole === 'EMPLOYEE' && request.status !== 'PENDING') {
      throw new Error('Un employé ne peut annuler une demande qu\'en attente.');
    }

    if (request.status === 'DELIVERED' || request.status === 'CANCELLED') {
      throw new Error(`Impossible d'annuler une demande au statut ${request.status}.`);
    }

    // Release reservations if it was approved
    if (request.status === 'APPROVED' || request.status === 'READY') {
      request.items?.forEach(it => {
        if (it.approved_quantity && it.approved_quantity > 0) {
          const prod = this.state.products.find(p => p.id === it.product_id);
          if (prod) {
            prod.reserved_stock = Math.max(0, prod.reserved_stock - it.approved_quantity);
          }
        }
      });
    }

    request.status = 'CANCELLED';
    request.rejection_reason = reason || 'Annulé par l\'utilisateur';
    request.updated_at = new Date().toISOString();
    request.items?.forEach(it => { it.status = 'CANCELLED'; });

    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'REQUEST_CANCEL',
      entity_type: 'stock_requests',
      entity_id: requestId,
      new_values: { status: 'CANCELLED', reason },
      notes: `Demande ${request.request_number} annulée.`,
    });

    this.save();
    if (typeof window !== 'undefined') {
      safeSupabaseSync(
        supabase.from('stock_requests').update({
          status: 'CANCELLED',
          rejection_reason: reason || 'Annulé par l\'utilisateur',
        }).eq('request_number', request.request_number)
      );
    }
    return request;
  }

  // 9. INVENTORY SESSION (MODULE D'INVENTAIRE PHYSIQUE & ANOMALIES)
  public createInventorySession(params: {
    sessionType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPOT';
    userId: string;
    userName: string;
    userRole: RoleType;
    notes?: string;
  }): InventorySession {
    this.load();
    const { sessionType, userId, userName, userRole, notes } = params;

    if (userRole === 'EMPLOYEE') {
      throw new Error('Accès refusé: Seul le responsable ou l\'administrateur peut lancer un inventaire.');
    }

    const sessionNumber = `INV-${new Date().getFullYear()}-${String(this.state.inventory_sessions.length + 1).padStart(4, '0')}`;
    const sessionId = `inv-${Date.now()}`;

    // Snapshot current active products
    const initialItems: InventoryItem[] = this.state.products
      .filter(p => p.is_active)
      .map(p => ({
        id: `inv-item-${Date.now()}-${p.id}`,
        session_id: sessionId,
        product_id: p.id,
        theoretical_stock: p.physical_stock,
        physical_count: p.physical_stock, // default pre-fill with theoretical
        difference: 0,
        unit_cost: p.purchase_price,
        difference_value: 0,
        has_anomaly: false,
        justification: '',
        counted_at: new Date().toISOString(),
      }));

    const session: InventorySession = {
      id: sessionId,
      session_number: sessionNumber,
      session_type: sessionType,
      status: 'IN_PROGRESS',
      conducted_by: userId,
      total_items_counted: 0,
      total_anomalies: 0,
      total_loss_value: 0,
      started_at: new Date().toISOString(),
      notes,
      items: initialItems,
      created_at: new Date().toISOString(),
    };

    this.state.inventory_sessions.unshift(session);

    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'INVENTORY_START',
      entity_type: 'inventory_sessions',
      entity_id: sessionId,
      new_values: { sessionNumber, sessionType },
      notes: `Démarrage de la session d'inventaire ${sessionNumber} (${sessionType})`,
    });

    this.save();
    return session;
  }

  public completeInventorySession(params: {
    sessionId: string;
    counts: { productId: string; physicalCount: number; justification?: string }[];
    userId: string;
    userName: string;
    userRole: RoleType;
  }): InventorySession {
    this.load();
    const { sessionId, counts, userId, userName, userRole } = params;

    const session = this.state.inventory_sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session d\'inventaire introuvable.');

    let anomalyCount = 0;
    let totalLoss = 0;

    const updatedItems: InventoryItem[] = counts.map(c => {
      const product = this.state.products.find(p => p.id === c.productId);
      const theoretical = product?.physical_stock ?? 0;
      const count = Number(c.physicalCount);
      const diff = Number((count - theoretical).toFixed(3));
      const hasAnomaly = diff !== 0;
      const unitCost = product?.purchase_price ?? 0;
      const diffValue = Number((diff * unitCost).toFixed(2));

      if (hasAnomaly) {
        anomalyCount++;
        if (diffValue < 0) totalLoss += Math.abs(diffValue);

        // CREATE A PENDING STOCK ADJUSTMENT (ANOMALIE)
        const adjNumber = `ADJ-${new Date().getFullYear()}-${String(this.state.stock_adjustments.length + 1).padStart(4, '0')}`;
        const newAdj: StockAdjustment = {
          id: `adj-${Date.now()}-${c.productId}`,
          adjustment_number: adjNumber,
          inventory_session_id: sessionId,
          product_id: c.productId,
          previous_stock: theoretical,
          adjusted_quantity: diff,
          new_stock: count,
          reason: c.justification || 'Écart constaté lors de l\'inventaire ' + session.session_number,
          status: 'PENDING_APPROVAL',
          requested_by: userId,
          created_at: new Date().toISOString(),
        };
        this.state.stock_adjustments.unshift(newAdj);
      }

      return {
        id: `inv-item-${Date.now()}-${c.productId}`,
        session_id: sessionId,
        product_id: c.productId,
        theoretical_stock: theoretical,
        physical_count: count,
        difference: diff,
        unit_cost: unitCost,
        difference_value: diffValue,
        has_anomaly: hasAnomaly,
        justification: c.justification || '',
        counted_at: new Date().toISOString(),
      };
    });

    session.items = updatedItems;
    session.total_items_counted = counts.length;
    session.total_anomalies = anomalyCount;
    session.total_loss_value = Number(totalLoss.toFixed(2));
    session.status = 'COMPLETED';
    session.completed_at = new Date().toISOString();

    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'INVENTORY_COMPLETE',
      entity_type: 'inventory_sessions',
      entity_id: sessionId,
      new_values: { sessionNumber: session.session_number, anomalyCount, totalLoss },
      notes: `Clôture de l'inventaire ${session.session_number}: ${anomalyCount} écarts détectés.`,
    });

    if (anomalyCount > 0) {
      // Alert Owner / Admin
      this.addNotification({
        recipient_role: 'ADMIN',
        title_fr: `Anomalies d'inventaire (${session.session_number})`,
        title_ar: `فروقات جرد بانتظار التسوية (${session.session_number})`,
        message_fr: `${anomalyCount} écart(s) de stock constatés lors de l'inventaire. En attente de votre autorisation de correction.`,
        message_ar: `تم تسجيل ${anomalyCount} فارق جرد بحاجة إلى موافقة المالك لتسوية الرصيد.`,
        type: 'INVENTORY_DISCREPANCY',
        reference_type: 'inventory_sessions',
        reference_id: sessionId,
      });
    }

    this.save();
    return session;
  }

  // 10. AUTHORIZE INVENTORY ADJUSTMENT (ADMIN PROPRIÉTAIRE SEULEMENT)
  public authorizeAdjustment(params: {
    adjustmentId: string;
    approved: boolean;
    adminNotes?: string;
    userId: string;
    userName: string;
    userRole: RoleType;
  }): StockAdjustment {
    this.load();
    const { adjustmentId, approved, adminNotes, userId, userName, userRole } = params;

    if (userRole !== 'ADMIN') {
      throw new Error('Seul l\'administrateur propriétaire peut autoriser ou rejeter une correction d\'inventaire.');
    }

    const adjustment = this.state.stock_adjustments.find(a => a.id === adjustmentId);
    if (!adjustment) throw new Error('Ajustement introuvable.');

    if (adjustment.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cet ajustement a déjà été traité (Statut: ${adjustment.status}).`);
    }

    const product = this.state.products.find(p => p.id === adjustment.product_id);
    if (!product) throw new Error('Produit introuvable.');

    if (approved) {
      const stockBefore = product.physical_stock;
      product.physical_stock = adjustment.new_stock;
      product.updated_at = new Date().toISOString();

      // Record movement
      const movementNumber = `MOUV-${new Date().getFullYear()}-${String(this.state.stock_movements.length + 1).padStart(4, '0')}`;
      const isAdd = adjustment.adjusted_quantity > 0;
      const movement: StockMovement = {
        id: `mouv-${Date.now()}`,
        movement_number: movementNumber,
        product_id: product.id,
        movement_type: isAdd ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUB',
        quantity: Math.abs(adjustment.adjusted_quantity),
        stock_before: stockBefore,
        stock_after: product.physical_stock,
        unit_cost: product.purchase_price,
        total_cost: Number((Math.abs(adjustment.adjusted_quantity) * product.purchase_price).toFixed(2)),
        reference_type: 'INVENTORY_ADJUSTMENT',
        reference_id: adjustmentId,
        performed_by: userId,
        notes: `Régularisation inventaire autorisée par propriétaire: ${adminNotes || adjustment.reason}`,
        created_at: new Date().toISOString(),
      };
      this.state.stock_movements.unshift(movement);

      adjustment.status = 'APPROVED';
    } else {
      adjustment.status = 'REJECTED';
    }

    adjustment.authorized_by = userId;
    adjustment.authorized_at = new Date().toISOString();
    adjustment.admin_notes = adminNotes;

    this.addAuditLog({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: 'STOCK_ADJUSTMENT_AUTHORIZE',
      entity_type: 'stock_adjustments',
      entity_id: adjustmentId,
      old_values: { status: 'PENDING_APPROVAL' },
      new_values: { status: adjustment.status, adminNotes },
      notes: `Décision sur ajustement ${adjustment.adjustment_number}: ${adjustment.status}`,
    });

    this.save();
    return adjustment;
  }

  // Helper Audit & Notification
  private addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    this.state.audit_logs.unshift(newLog);
  }

  private addNotification(notif: Omit<Notification, 'id' | 'created_at' | 'is_read'>) {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.state.notifications.unshift(newNotif);
  }

  public markNotificationAsRead(id: string) {
    this.load();
    const notif = this.state.notifications.find(n => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.save();
    }
  }

  public resetToDefault() {
    this.state = getInitialState();
    this.save();
  }
}

// Singleton export
export const stockService = new StockDatabaseService();
