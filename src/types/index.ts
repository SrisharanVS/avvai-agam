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

// ─── Product Types ───────────────────────────────────────────────────────────

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountedPrice: number | null;
  stock: number;
  imageUrls: string[];
  featured: boolean;
  weight: string | null;
  rating: number;
  reviewCount: number;
  tags: string[];
  category: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  nutritionInfo: string | null;
  ingredients: string | null;
  benefits: string | null;
  tags: string[];
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
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  discountedPrice: number | null;
  imageUrl: string;
  weight: string | null;
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
  productName: string;
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
  productName: string;
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
