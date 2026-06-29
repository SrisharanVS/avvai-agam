import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting master data backfill...");

  // 1. Backfill ProductVariant SKUs
  const variants = await prisma.productVariant.findMany({
    orderBy: { createdAt: "asc" },
    include: { product: true }
  });
  console.log(`Found ${variants.length} variants to check for SKUs.`);
  let varCount = 1;
  for (const variant of variants) {
    if (!variant.sku) {
      const sku = `VAR-${String(varCount).padStart(6, "0")}`;
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { sku }
      });
      console.log(`Assigned SKU ${sku} to variant: ${variant.variantName} of product: ${variant.product.name}`);
      varCount++;
    } else {
      const parts = variant.sku.split("-");
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num >= varCount) {
          varCount = num + 1;
        }
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
      if (parts.length > 1) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num >= cusCount) {
          cusCount = num + 1;
        }
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
        where: { name: { equals: item.productName, mode: "insensitive" } },
        include: { variants: true }
      });
      const firstVariant = prod?.variants[0];

      await prisma.invoiceItem.update({
        where: { id: item.id },
        data: {
          productId: prod?.id || null,
          productNameSnapshot: item.productNameSnapshot || item.productName,
          skuSnapshot: item.skuSnapshot || firstVariant?.sku || "PROD-UNKNOWN",
          unitSnapshot: item.unitSnapshot || firstVariant?.unit || "units",
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
      ? await prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true }
        })
      : await prisma.product.findFirst({
          where: { name: { equals: item.productName, mode: "insensitive" } },
          include: { variants: true }
        });
    const firstVariant = prod?.variants[0];

    await prisma.purchaseOrderItem.update({
      where: { id: item.id },
      data: {
        productId: prod?.id || item.productId,
        productNameSnapshot: item.productNameSnapshot || item.productName,
        skuSnapshot: item.skuSnapshot || firstVariant?.sku || "PROD-UNKNOWN",
        unitSnapshot: item.unitSnapshot || item.unit || firstVariant?.unit || "units",
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
