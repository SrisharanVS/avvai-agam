import { prisma } from "../lib/prisma";

async function run() {
  console.log("Checking recently created/updated database records...\n");

  // 1. Check Customer 'Srisharan V S'
  const customer = await prisma.customer.findFirst({
    where: { name: "Srisharan V S" },
    include: {
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { items: true }
      }
    }
  });

  if (customer) {
    console.log("--- Customer Profile ---");
    console.log(`ID: ${customer.customerId}`);
    console.log(`Name: ${customer.name}`);
    console.log(`Phone: ${customer.phone}`);
    console.log(`Email: ${customer.email}`);
    console.log(`GST: ${customer.gstNumber}`);
    console.log(`Address: ${customer.address}`);
    console.log();

    if (customer.invoices.length > 0) {
      const lastInv = customer.invoices[0];
      console.log("--- Last Invoice Snapshot ---");
      console.log(`Invoice Number: ${lastInv.invoiceNumber}`);
      console.log(`Status: ${lastInv.status}`);
      console.log(`Subtotal: ₹${lastInv.subtotal}`);
      console.log(`Tax: ₹${lastInv.taxAmount}`);
      console.log(`Total: ₹${lastInv.totalAmount}`);
      console.log("Invoice Snapshot Fields:");
      console.log(`- customerNameSnapshot: ${lastInv.customerNameSnapshot}`);
      console.log(`- customerEmailSnapshot: ${lastInv.customerEmailSnapshot}`);
      console.log(`- customerPhoneSnapshot: ${lastInv.customerPhoneSnapshot}`);
      console.log(`- billingAddressSnapshot: ${lastInv.billingAddressSnapshot}`);
      console.log(`- gstNumberSnapshot: ${lastInv.gstNumberSnapshot}`);
      console.log("Line Items Snapshots:");
      lastInv.items.forEach((item) => {
        console.log(`  * ${item.productName}: Qty ${item.quantity}, Price ₹${item.unitPrice}, Tax ${item.taxRate}%`);
        console.log(`    - productNameSnapshot: ${item.productNameSnapshot}`);
        console.log(`    - skuSnapshot: ${item.skuSnapshot}`);
        console.log(`    - unitSnapshot: ${item.unitSnapshot}`);
        console.log(`    - unitPriceSnapshot: ${item.unitPriceSnapshot}`);
        console.log(`    - taxRateSnapshot: ${item.taxRateSnapshot}`);
      });
      console.log();
    }
  } else {
    console.log("Customer 'Srisharan V S' not found.\n");
  }

  // 2. Check Purchase Orders
  const lastPO = await prisma.purchaseOrder.findFirst({
    orderBy: { createdAt: "desc" },
    include: { items: true, supplier: true }
  });

  if (lastPO) {
    console.log("--- Last Purchase Order Snapshot ---");
    console.log(`PO Number: ${lastPO.poNumber}`);
    console.log(`Supplier: ${lastPO.supplier.name}`);
    console.log(`Status: ${lastPO.status}`);
    console.log(`Total Amount: ₹${lastPO.totalAmount}`);
    console.log("Line Items Snapshots:");
    lastPO.items.forEach((item) => {
      console.log(`  * ${item.productName}: Qty ${item.quantity}, Cost ₹${item.costPrice}, Tax ${item.taxRate}%`);
      console.log(`    - productNameSnapshot: ${item.productNameSnapshot}`);
      console.log(`    - skuSnapshot: ${item.skuSnapshot}`);
      console.log(`    - unitSnapshot: ${item.unitSnapshot}`);
      console.log(`    - costPriceSnapshot: ${item.costPriceSnapshot}`);
      console.log(`    - taxRateSnapshot: ${item.taxRateSnapshot}`);
    });
    console.log();
  }

  // 3. Check Auto-created Product
  const newProduct = await prisma.product.findFirst({
    where: { name: { contains: "Turmeric Oil", mode: "insensitive" } }
  });

  if (newProduct) {
    console.log("--- Auto-Created Product Details ---");
    console.log(`SKU: ${newProduct.sku}`);
    console.log(`Name: ${newProduct.name}`);
    console.log(`Unit: ${newProduct.unit}`);
    console.log(`Cost Price: ₹${newProduct.costPrice}`);
    console.log(`Selling Price: ₹${newProduct.price}`);
    console.log(`Stock: ${newProduct.stock}`);
    console.log(`Active: ${newProduct.active}`);
    console.log();
  } else {
    console.log("Auto-created product 'Super Organic Turmeric Oil' not found.\n");
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
