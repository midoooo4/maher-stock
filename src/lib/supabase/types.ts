export type RoleType = 'ADMIN' | 'RESPONSABLE' | 'EMPLOYEE';

export type DepartmentType = 'Cuisine' | 'Cafe' | 'Restaurant' | 'Piscine' | 'Entretien' | 'Autre';

export type RequestStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'READY' 
  | 'PARTIALLY_DELIVERED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUB' | 'CANCEL_RESTORE';

export type UnitType = 
  | 'kg' 
  | 'g' 
  | 'l' 
  | 'ml' 
  | 'piece' 
  | 'paquet' 
  | 'carton' 
  | 'bouteille' 
  | 'sac';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: RoleType;
  department?: DepartmentType | string;
  phone?: string;
  is_active: boolean;
  pin_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  code: string;
  name_fr: string;
  name_ar: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  code: string;
  name_fr: string;
  name_ar: string;
  description?: string;
  category_id: string;
  category?: Category;
  unit: UnitType | string;
  physical_stock: number;
  reserved_stock: number;
  min_stock: number;
  purchase_price: number; // Coût Moyen Pondéré (PMP)
  supplier_id?: string;
  supplier?: Supplier;
  location?: string;
  image_url?: string;
  qr_code_data?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockEntry {
  id: string;
  entry_number: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier_id?: string;
  supplier?: Supplier;
  invoice_number?: string;
  invoice_photo_url?: string;
  received_by: string;
  receiver?: Profile;
  received_at: string;
  notes?: string;
  created_at: string;
}

export interface StockRequestItem {
  id: string;
  request_id: string;
  product_id: string;
  product?: Product;
  requested_quantity: number;
  approved_quantity?: number | null;
  delivered_quantity?: number | null;
  unit: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED' | 'CANCELLED';
  created_at: string;
}

export interface StockRequest {
  id: string;
  request_number: string;
  employee_id: string;
  employee?: Profile;
  department: DepartmentType | string;
  status: RequestStatus;
  reason: string;
  notes?: string;
  approved_by?: string;
  approver?: Profile;
  approved_at?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: string;
  prepared_by?: string;
  prepared_at?: string;
  delivered_by?: string;
  deliverer?: Profile;
  delivered_at?: string;
  delivery_notes?: string;
  items?: StockRequestItem[];
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  movement_number: string;
  product_id: string;
  product?: Product;
  movement_type: MovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  unit_cost: number;
  total_cost: number;
  reference_type: 'ENTRY' | 'REQUEST' | 'INVENTORY_ADJUSTMENT';
  reference_id?: string;
  performed_by: string;
  performer?: Profile;
  notes?: string;
  created_at: string;
}

export interface InventorySession {
  id: string;
  session_number: string;
  session_type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPOT';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  conducted_by: string;
  conductor?: Profile;
  total_items_counted: number;
  total_anomalies: number;
  total_loss_value: number;
  started_at: string;
  completed_at?: string;
  notes?: string;
  items?: InventoryItem[];
  created_at: string;
}

export interface InventoryItem {
  id: string;
  session_id: string;
  product_id: string;
  product?: Product;
  theoretical_stock: number;
  physical_count: number;
  difference: number;
  unit_cost: number;
  difference_value: number;
  has_anomaly: boolean;
  justification?: string;
  counted_at: string;
}

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  inventory_session_id?: string;
  inventory_item_id?: string;
  product_id: string;
  product?: Product;
  previous_stock: number;
  adjusted_quantity: number;
  new_stock: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requested_by: string;
  requester?: Profile;
  authorized_by?: string;
  authorizer?: Profile;
  authorized_at?: string;
  admin_notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id?: string;
  recipient_role?: RoleType | 'ALL';
  title_fr: string;
  title_ar: string;
  message_fr: string;
  message_ar: string;
  type: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
  created_at: string;
}
