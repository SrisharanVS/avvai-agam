// Shared TypeScript types across the full stack

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Product Unit ─────────────────────────────────────────────────────────────

export type ProductUnit = "GRAM" | "KILOGRAM" | "MILLILITRE" | "LITRE" | "CUSTOM";

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  GRAM: "Gram",
  KILOGRAM: "Kilogram",
  MILLILITRE: "Millilitre",
  LITRE: "Litre",
  CUSTOM: "Custom",
};

export const PRODUCT_UNIT_ABBR: Record<ProductUnit, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITRE: "ml",
  LITRE: "L",
  CUSTOM: "",
};

// ─── Product Variant Types ────────────────────────────────────────────────────

export interface ProductVariantType {
  id: string;
  productId: string;
  sku: string | null;
  variantName: string;       // e.g. "500 ml", "1 L", "2 Bottles"
  quantityValue: number;
  unit: ProductUnit;
  customUnit: string | null; // only when unit === "CUSTOM"
  sellingPrice: number;
  costPrice: number | null;
  stock: number;
  shippingWeight: number;    // in kg
  barcode: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form shape used in admin UI (all strings for controlled inputs)
export interface VariantFormRow {
  id?: string;            // undefined = new variant
  variantName: string;
  quantityValue: string;
  unit: ProductUnit;
  customUnit: string;
  sellingPrice: string;
  costPrice: string;
  stock: string;
  shippingWeight: string;
  sku: string;
  isDefault: boolean;
  active: boolean;
}

// ─── Product Types ───────────────────────────────────────────────────────────

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  imageUrls: string[];
  featured: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  active: boolean;
  category: { id: string; name: string; slug: string };
  variants: ProductVariantType[];
  // Computed from variants
  minPrice: number;
  maxPrice: number;
  variantCount: number;
  totalStock: number;
  createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  nutritionInfo: string | null;
  ingredients: string | null;
  benefits: string | null;
  tags: string[];
  related?: ProductListItem[];
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  inStock?: boolean;
  sort?: "price_asc" | "price_desc" | "newest" | "rating" | "popular";
  page?: number;
  limit?: number;
}

// ─── Category Types ──────────────────────────────────────────────────────────

export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count?: { products: number };
}

// ─── Cart Types ──────────────────────────────────────────────────────────────

export interface CartItem {
  // Unique key for cart deduplication
  variantId: string;
  // References
  productId: string;
  productName: string;
  slug: string;
  // Variant info
  variantName: string;        // e.g. "500 ml"
  sku: string | null;
  unit: ProductUnit;
  customUnit: string | null;
  // Pricing
  price: number;              // sellingPrice of the selected variant
  // Logistics
  imageUrl: string;
  shippingWeight: number;     // in kg, per unit
  // Inventory
  quantity: number;
  stock: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

// ─── Order Types ─────────────────────────────────────────────────────────────

export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  deliveryNotes?: string;
  paymentMethod: "COD" | "RAZORPAY" | "STRIPE";
  couponCode?: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  gatewayFee?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  items: OrderItemType[];
  createdAt: string;
}

export interface OrderItemType {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantNameSnapshot: string | null;
  quantityValueSnapshot: number | null;
  unitSnapshot: string | null;
  customUnitSnapshot: string | null;
  skuSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Invoice Types ───────────────────────────────────────────────────────────

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  type: "ECOMMERCE" | "MANUAL";
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  gatewayFee?: number;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  createdAt: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  billingAddress: string | null;
  taxRate: number;
  paymentMethod: string;
  notes: string | null;
  pdfUrl: string | null;
  items: InvoiceItemType[];
}

export interface InvoiceItemType {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantNameSnapshot: string | null;
  quantityValueSnapshot: number | null;
  unitSnapshot: string | null;
  customUnitSnapshot: string | null;
  skuSnapshot: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface CreateInvoiceData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: string;
  taxRate?: number;
  discountAmount?: number;
  shippingAmount?: number;
  paymentMethod?: string;
  notes?: string;
  items: {
    productId?: string;
    variantId?: string;
    productName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }[];
}

// ─── Admin Types ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  recentOrders: OrderSummary[];
  pendingPOCount?: number;
  inventoryValue?: number;
  lowStockProducts?: LowStockProduct[];
}

export interface LowStockProduct {
  id: string;
  name: string;
  // Aggregated from variants
  totalStock: number;
  variantCount: number;
}

// ─── Status Enums ────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";
export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";
export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "ADJUSTMENT"
  | "RETURN"
  | "DAMAGED";

// ─── Supplier Types ───────────────────────────────────────────────────────────

export interface SupplierType {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  address: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { purchaseOrders: number };
}

export interface SupplierDetail extends SupplierType {
  purchaseOrders: PurchaseOrderSummary[];
  totalSpend: number;
  totalOrders: number;
}

// ─── Purchase Order Types ─────────────────────────────────────────────────────

export interface PurchaseOrderItemType {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantNameSnapshot: string | null;
  skuSnapshot: string | null;
  quantity: number;
  receivedQuantity: number;
  unit: string;
  costPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier: { id: string; name: string; email: string | null };
  status: PurchaseOrderStatus;
  expectedDeliveryDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface PurchaseOrderDetail extends PurchaseOrderSummary {
  notes: string | null;
  items: PurchaseOrderItemType[];
}

export interface CreatePurchaseOrderData {
  supplierId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: {
    productId?: string;
    variantId?: string;
    productName: string;
    quantity: number;
    unit?: string;
    costPrice: number;
    taxRate?: number;
  }[];
}

export interface ReceiveInventoryData {
  items: {
    itemId: string;
    receivedQuantity: number;
  }[];
  notes?: string;
}

// ─── Inventory Movement Types ─────────────────────────────────────────────────

export interface InventoryMovementType {
  id: string;
  productId: string;
  product: { id: string; name: string; slug: string };
  variantId: string | null;
  variant: { id: string; variantName: string; sku: string | null } | null;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}
