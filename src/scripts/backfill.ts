import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting master data backfill...");

  // 1. Backfill Product SKUs
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" }
  });
  console.log(`Found ${products.length} products to check for SKUs.`);
  let prodCount = 1;
  for (const prod of products) {
    if (!prod.sku) {
      const sku = `PROD-${String(prodCount).padStart(6, "0")}`;
      await prisma.product.update({
        where: { id: prod.id },
        data: { sku }
      });
      console.log(`Assigned SKU ${sku} to product: ${prod.name}`);
      prodCount++;
    } else {
      // Find the number from existing sku to ensure sequence count remains safe
      const parts = prod.sku.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num >= prodCount) {
        prodCount = num + 1;
      }
    }
  }

  // 2. Derive Customers from Invoices and Orders
  console.log("Deriving Customers from Invoices and Orders...");
  const invoices = await prisma.invoice.findMany({
    include: { items: true }
  });
  const orders = await prisma.order.findMany();

  // Map to store unique customers by email
  const customerMap = new Map<string, { name: string; phone: string; address: string }>();

  // Extract from invoices
  for (const inv of invoices) {
    const email = inv.customerEmail.toLowerCase().trim();
    if (email && !customerMap.has(email)) {
      customerMap.set(email, {
        name: inv.customerName,
        phone: inv.customerPhone || "",
        address: inv.billingAddress || ""
      });
    }
  }

  // Extract from orders
  for (const ord of orders) {
    const email = ord.customerEmail.toLowerCase().trim();
    if (email && !customerMap.has(email)) {
      customerMap.set(email, {
        name: ord.customerName,
        phone: ord.customerPhone,
        address: `${ord.address}, ${ord.city}, ${ord.state} - ${ord.pincode}`
      });
    }
  }

  console.log(`Found ${customerMap.size} unique customer profiles to create.`);
  
  let cusCount = 1;
  const emailToCustomerRecord = new Map<string, any>();

  for (const [email, details] of customerMap.entries()) {
    // Check if customer already exists in DB
    let existingCus = await prisma.customer.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    });

    if (!existingCus) {
      const customerId = `CUS-${String(cusCount).padStart(6, "0")}`;
      existingCus = await prisma.customer.create({
        data: {
          customerId,
          name: details.name,
          email,
          phone: details.phone,
          address: details.address
        }
      });
      console.log(`Created customer record ${customerId} for ${details.name} (${email})`);
      cusCount++;
    } else {
      const parts = existingCus.customerId.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num >= cusCount) {
        cusCount = num + 1;
      }
    }
    emailToCustomerRecord.set(email, existingCus);
  }

  // 3. Update Invoice snapshots and Customer links
  console.log("Updating Invoice Customer links and snapshots...");
  for (const inv of invoices) {
    const email = inv.customerEmail.toLowerCase().trim();
    const cus = emailToCustomerRecord.get(email);
    
    const updateData: any = {
      customerId: cus?.id || null,
      customerIdSnapshot: cus?.customerId || null,
      customerNameSnapshot: inv.customerNameSnapshot || inv.customerName,
      customerPhoneSnapshot: inv.customerPhoneSnapshot || inv.customerPhone,
      customerEmailSnapshot: inv.customerEmailSnapshot || inv.customerEmail,
      customerAddressSnapshot: inv.customerAddressSnapshot || inv.billingAddress,
      gstNumberSnapshot: inv.gstNumberSnapshot || null
    };

    await prisma.invoice.update({
      where: { id: inv.id },
      data: updateData
    });

    // Update Invoice items with product snapshots
    for (const item of inv.items) {
      // Try to find product by name
      const prod = await prisma.product.findFirst({
        where: { name: { equals: item.productName, mode: "insensitive" } }
      });

      await prisma.invoiceItem.update({
        where: { id: item.id },
        data: {
          productId: prod?.id || null,
          productNameSnapshot: item.productNameSnapshot || item.productName,
          skuSnapshot: item.skuSnapshot || prod?.sku || "PROD-UNKNOWN",
          unitSnapshot: item.unitSnapshot || prod?.unit || "units",
          unitPriceSnapshot: item.unitPriceSnapshot || item.unitPrice,
          taxRateSnapshot: item.taxRateSnapshot || item.taxRate
        }
      });
    }
  }

  // 4. Update Purchase Order item snapshots
  console.log("Updating Purchase Order item snapshots...");
  const poItems = await prisma.purchaseOrderItem.findMany();
  for (const item of poItems) {
    const prod = item.productId
      ? await prisma.product.findUnique({ where: { id: item.productId } })
      : await prisma.product.findFirst({ where: { name: { equals: item.productName, mode: "insensitive" } } });

    await prisma.purchaseOrderItem.update({
      where: { id: item.id },
      data: {
        productId: prod?.id || item.productId,
        productNameSnapshot: item.productNameSnapshot || item.productName,
        skuSnapshot: item.skuSnapshot || prod?.sku || "PROD-UNKNOWN",
        unitSnapshot: item.unitSnapshot || item.unit || prod?.unit || "units",
        costPriceSnapshot: item.costPriceSnapshot || item.costPrice,
        taxRateSnapshot: item.taxRateSnapshot || item.taxRate
      }
    });
  }

  console.log("Backfill complete!");
}

main()
  .catch((e) => {
    console.error("Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
