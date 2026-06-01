import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

// Stylesheet for professional, premium PDF matching Avvai's branding
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#333333",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: "column",
  },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: "#2D5016", // Avvai green
  },
  brandTagline: {
    fontSize: 8,
    color: "#6B7C3A",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  companyDetails: {
    textAlign: "right",
    color: "#64748B",
    fontSize: 8,
    lineHeight: 1.3,
  },
  invoiceMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  metaCol: {
    width: "48%",
  },
  metaTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#2D5016",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#475569",
  },
  table: {
    flexDirection: "column",
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colDesc: { width: "45%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTax: { width: "12%", textAlign: "center" },
  colTotal: { width: "18%", textAlign: "right" },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#475569",
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 9,
    color: "#334155",
  },
  itemDesc: {
    fontSize: 7,
    color: "#64748B",
    marginTop: 2,
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  totalsTable: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#64748B",
  },
  totalsVal: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#334155",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#2D5016",
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#2D5016",
  },
  grandTotalVal: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#2D5016",
  },
  notesContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: "#64748B",
    lineHeight: 1.3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#94A3B8",
  },
});

interface PDFInvoiceItem {
  productName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface PDFInvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  billingAddress?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paymentMethod: string;
  notes?: string | null;
  createdAt: Date | string;
  items: PDFInvoiceItem[];
}

export function InvoicePDF({ invoice }: { invoice: PDFInvoiceData }) {
  const formattedDate = new Date(invoice.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.brandName}>Avvai</Text>
            <Text style={styles.brandTagline}>Pure Food. Naturally Yours.</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#1E293B" }}>Avvai Natural Foods</Text>
            <Text>12, Farm Direct Lane, Organic Hub</Text>
            <Text>Chennai, Tamil Nadu, 600001</Text>
            <Text>Email: support@avvai.in | Web: www.avvai.in</Text>
            <Text>GSTIN: 33AAAAA1111A1Z1 (Placeholder)</Text>
          </View>
        </View>

        {/* Invoice Meta */}
        <View style={styles.invoiceMetaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>Bill To</Text>
            <Text style={[styles.metaText, { fontFamily: "Helvetica-Bold", color: "#1E293B" }]}>
              {invoice.customerName}
            </Text>
            <Text style={styles.metaText}>{invoice.customerEmail}</Text>
            {invoice.customerPhone && <Text style={styles.metaText}>{invoice.customerPhone}</Text>}
            {invoice.billingAddress && (
              <Text style={[styles.metaText, { marginTop: 4 }]}>{invoice.billingAddress}</Text>
            )}
          </View>
          <View style={[styles.metaCol, { textAlign: "right" }]}>
            <Text style={styles.metaTitle}>Invoice Details</Text>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Invoice #: </Text>
              {invoice.invoiceNumber}
            </Text>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Date: </Text>
              {formattedDate}
            </Text>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Payment Method: </Text>
              {invoice.paymentMethod}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>Item Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableHeaderText}>Qty</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Rate</Text>
            </View>
            <View style={styles.colTax}>
              <Text style={styles.tableHeaderText}>Tax %</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Amount</Text>
            </View>
          </View>

          {/* Table Rows */}
          {invoice.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={[styles.tableCellText, { fontFamily: "Helvetica-Bold" }]}>
                  {item.productName}
                </Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tableCellText}>{item.quantity}</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  Rs. {item.unitPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.colTax}>
                <Text style={styles.tableCellText}>{item.taxRate}%</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={[styles.tableCellText, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  Rs. {item.total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsVal}>Rs. {invoice.subtotal.toFixed(2)}</Text>
            </View>
            {invoice.taxAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>GST/Tax:</Text>
                <Text style={styles.totalsVal}>Rs. {invoice.taxAmount.toFixed(2)}</Text>
              </View>
            )}
            {invoice.shippingAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Shipping:</Text>
                <Text style={styles.totalsVal}>Rs. {invoice.shippingAmount.toFixed(2)}</Text>
              </View>
            )}
            {invoice.discountAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: "#16A34A" }]}>Discount:</Text>
                <Text style={[styles.totalsVal, { color: "#16A34A" }]}>-Rs. {invoice.discountAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalVal}>Rs. {invoice.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Terms & Conditions / Notes</Text>
          <Text style={styles.notesText}>
            {invoice.notes ||
              "Thank you for shopping with Avvai Natural Foods! We promise farm-fresh purity in every pack. Goods once sold are not returnable under normal circumstances. For issues or query resolution, write to support@avvai.in."}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Avvai Natural Foods — Pure Food. Naturally Yours.</Text>
        </View>
      </Page>
    </Document>
  );
}

// Function to compile React PDF component to Node.js Buffer
export async function generateInvoicePDFBuffer(invoice: PDFInvoiceData): Promise<Buffer> {
  const doc = React.createElement(InvoicePDF, { invoice });
  return await renderToBuffer(doc as any);
}

// ─── Purchase Order PDF ────────────────────────────────────────────────────────

interface PDFPOItem {
  productName: string;
  quantity: number;
  unit: string;
  costPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface PDFPurchaseOrderData {
  poNumber: string;
  status: string;
  expectedDeliveryDate?: Date | string | null;
  notes?: string | null;
  supplier: {
    name: string;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    gstNumber?: string | null;
  };
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: Date | string;
  items: PDFPOItem[];
}

const poStyles = StyleSheet.create({
  poTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: "#2D5016",
    marginBottom: 4,
  },
  poSubtitle: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusBadge: {
    fontSize: 8,
    color: "#4A7C2F",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  colProduct: { width: "35%" },
  colQty: { width: "10%", textAlign: "center" },
  colUnit: { width: "10%", textAlign: "center" },
  colCost: { width: "15%", textAlign: "right" },
  colTax: { width: "12%", textAlign: "center" },
  colTotal: { width: "18%", textAlign: "right" },
});

export function PurchaseOrderPDF({ po }: { po: PDFPurchaseOrderData }) {
  const formattedDate = new Date(po.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const deliveryDate = po.expectedDeliveryDate
    ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "TBD";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.brandName}>Avvai</Text>
            <Text style={styles.brandTagline}>Pure Food. Naturally Yours.</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#1E293B" }}>Avvai Natural Foods</Text>
            <Text>12, Farm Direct Lane, Organic Hub</Text>
            <Text>Chennai, Tamil Nadu, 600001</Text>
            <Text>Email: support@avvai.in | Web: www.avvai.in</Text>
            <Text>GSTIN: 33AAAAA1111A1Z1 (Placeholder)</Text>
          </View>
        </View>

        {/* PO Title */}
        <View style={{ marginBottom: 20 }}>
          <Text style={poStyles.poTitle}>PURCHASE ORDER</Text>
          <Text style={poStyles.poSubtitle}>{po.poNumber}</Text>
          <Text style={poStyles.statusBadge}>{po.status.replace(/_/g, " ")}</Text>
        </View>

        {/* Meta */}
        <View style={styles.invoiceMetaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>Supplier</Text>
            <Text style={[styles.metaText, { fontFamily: "Helvetica-Bold", color: "#1E293B" }]}>
              {po.supplier.name}
            </Text>
            {po.supplier.contactPerson && (
              <Text style={styles.metaText}>Attn: {po.supplier.contactPerson}</Text>
            )}
            {po.supplier.email && <Text style={styles.metaText}>{po.supplier.email}</Text>}
            {po.supplier.phone && <Text style={styles.metaText}>{po.supplier.phone}</Text>}
            {po.supplier.address && (
              <Text style={[styles.metaText, { marginTop: 4 }]}>{po.supplier.address}</Text>
            )}
            {po.supplier.gstNumber && (
              <Text style={styles.metaText}>GST: {po.supplier.gstNumber}</Text>
            )}
          </View>
          <View style={[styles.metaCol, { textAlign: "right" }]}>
            <Text style={styles.metaTitle}>PO Details</Text>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>PO #: </Text>
              {po.poNumber}
            </Text>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Date: </Text>
              {formattedDate}
            </Text>
            <Text style={styles.metaText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Expected Delivery: </Text>
              {deliveryDate}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={poStyles.colProduct}>
              <Text style={styles.tableHeaderText}>Product</Text>
            </View>
            <View style={poStyles.colQty}>
              <Text style={styles.tableHeaderText}>Qty</Text>
            </View>
            <View style={poStyles.colUnit}>
              <Text style={styles.tableHeaderText}>Unit</Text>
            </View>
            <View style={poStyles.colCost}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Cost Price</Text>
            </View>
            <View style={poStyles.colTax}>
              <Text style={styles.tableHeaderText}>Tax %</Text>
            </View>
            <View style={poStyles.colTotal}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Total</Text>
            </View>
          </View>

          {po.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={poStyles.colProduct}>
                <Text style={[styles.tableCellText, { fontFamily: "Helvetica-Bold" }]}>
                  {item.productName}
                </Text>
              </View>
              <View style={poStyles.colQty}>
                <Text style={styles.tableCellText}>{item.quantity}</Text>
              </View>
              <View style={poStyles.colUnit}>
                <Text style={styles.tableCellText}>{item.unit}</Text>
              </View>
              <View style={poStyles.colCost}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  Rs. {item.costPrice.toFixed(2)}
                </Text>
              </View>
              <View style={poStyles.colTax}>
                <Text style={styles.tableCellText}>{item.taxRate}%</Text>
              </View>
              <View style={poStyles.colTotal}>
                <Text style={[styles.tableCellText, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  Rs. {item.total.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text style={styles.totalsVal}>Rs. {po.subtotal.toFixed(2)}</Text>
            </View>
            {po.taxAmount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>GST/Tax:</Text>
                <Text style={styles.totalsVal}>Rs. {po.taxAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalVal}>Rs. {po.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {po.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes / Terms</Text>
            <Text style={styles.notesText}>{po.notes}</Text>
          </View>
        )}

        {/* Signature area */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 40 }}>
          <View style={{ width: "45%" }}>
            <View style={{ borderTopWidth: 1, borderTopColor: "#CBD5E1", paddingTop: 6 }}>
              <Text style={{ fontSize: 8, color: "#64748B" }}>Authorised Signatory — Avvai Natural Foods</Text>
            </View>
          </View>
          <View style={{ width: "45%" }}>
            <View style={{ borderTopWidth: 1, borderTopColor: "#CBD5E1", paddingTop: 6 }}>
              <Text style={{ fontSize: 8, color: "#64748B" }}>Acknowledged by — {po.supplier.name}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Avvai Natural Foods — Pure Food. Naturally Yours.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePurchaseOrderPDFBuffer(po: PDFPurchaseOrderData): Promise<Buffer> {
  const doc = React.createElement(PurchaseOrderPDF, { po });
  return await renderToBuffer(doc as any);
}

