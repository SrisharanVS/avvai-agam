import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

// const prisma = PrismaClient;

const categories = [
    { name: "Organic Rice", slug: "organic-rice", description: "Ancient grain varieties, traditionally harvested", imageUrl: "" },
    { name: "Millets", slug: "millets", description: "Nutritious ancient grains, naturally gluten-free", imageUrl: "" },
    { name: "Cold Pressed Oils", slug: "cold-pressed-oils", description: "Extracted at low temperature for maximum nutrition", imageUrl: "" },
    { name: "Natural Sweeteners", slug: "natural-sweeteners", description: "Jaggery, honey, and natural palm sugar", imageUrl: "" },
    { name: "Herbal Products", slug: "herbal-products", description: "Traditional remedies and wellness products", imageUrl: "" },
    { name: "Spices", slug: "spices", description: "Pure, unadulterated aromatic spices", imageUrl: "" },
    { name: "Dry Fruits", slug: "dry-fruits", description: "Premium nuts, seeds and dried fruits", imageUrl: "" },
    { name: "Traditional Foods", slug: "traditional-foods", description: "Authentic recipes with heritage ingredients", imageUrl: "" },
    { name: "Pulses", slug: "pulses", description: "Protein-rich legumes naturally grown", imageUrl: "" },
    { name: "Snacks", slug: "snacks", description: "Healthy, guilt-free traditional snacks", imageUrl: "" },
];

async function main() {
    console.log("🌱 Seeding Avvai database...");

    // Create admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@avvai.in";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.admin.upsert({
        where: { email: adminEmail },
        update: {},
        create: { email: adminEmail, passwordHash, name: "Avvai Admin", role: "ADMIN" },
    });
    console.log(`✓ Admin created: ${adminEmail}`);

    // Create categories
    const createdCategories: Record<string, string> = {};
    for (const cat of categories) {
        const created = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
        createdCategories[cat.slug] = created.id;
    }
    console.log(`✓ ${categories.length} categories created`);

    // Create sample products
    const products = [
        // Rice
        { name: "Mappillai Samba Rice", slug: "mappillai-samba-rice", categorySlug: "organic-rice", price: 280, discountedPrice: 249, stock: 100, weight: "1 kg", featured: true, description: "Traditional Tamil Nadu rice variety. Rich in iron and nutrients. Naturally red in color.", benefits: "High iron content, good for anemia, aids digestion, traditional variety", ingredients: "100% Organic Mappillai Samba Rice", nutritionInfo: "Energy: 345kcal, Protein: 7g, Carbs: 78g, Fat: 1g per 100g", tags: ["organic", "traditional", "iron-rich"] },
        { name: "Ponni Raw Rice", slug: "ponni-raw-rice", categorySlug: "organic-rice", price: 180, discountedPrice: 159, stock: 200, weight: "1 kg", featured: false, description: "Organic Ponni rice, perfect for everyday cooking. Light, fluffy texture.", benefits: "Easy to digest, good for all ages, excellent cooking quality", ingredients: "100% Organic Ponni Rice", nutritionInfo: "Energy: 350kcal, Protein: 7g per 100g", tags: ["organic", "everyday", "ponni"] },
        { name: "Kichili Samba Rice", slug: "kichili-samba-rice", categorySlug: "organic-rice", price: 220, stock: 80, weight: "1 kg", featured: false, description: "Premium small grain rice, ideal for biryani and special dishes.", tags: ["organic", "biryani", "premium"] },

        // Millets
        { name: "Foxtail Millet (Thinai)", slug: "foxtail-millet-thinai", categorySlug: "millets", price: 120, discountedPrice: 99, stock: 150, weight: "500 g", featured: true, description: "Ancient Tamil millet, rich in dietary fiber and minerals. Used in traditional recipes.", benefits: "Controls blood sugar, high fiber, iron-rich, weight management", ingredients: "100% Organic Foxtail Millet", nutritionInfo: "Energy: 351kcal, Protein: 11g, Fiber: 8g per 100g", tags: ["millet", "organic", "traditional", "diabetic-friendly"] },
        { name: "Barnyard Millet (Kuthiraivali)", slug: "barnyard-millet-kuthiraivali", categorySlug: "millets", price: 140, discountedPrice: 119, stock: 120, weight: "500 g", featured: true, description: "Gluten-free ancient grain with excellent nutritional profile.", benefits: "Gluten-free, high calcium, good for bone health, weight loss", ingredients: "100% Organic Barnyard Millet", tags: ["millet", "gluten-free", "calcium-rich"] },
        { name: "Pearl Millet (Kambu)", slug: "pearl-millet-kambu", categorySlug: "millets", price: 90, stock: 200, weight: "500 g", featured: false, description: "Nutritious millet for cooling porridge and traditional dishes.", tags: ["millet", "traditional", "cooling"] },
        { name: "Little Millet (Samai)", slug: "little-millet-samai", categorySlug: "millets", price: 110, discountedPrice: 95, stock: 130, weight: "500 g", featured: false, description: "Tiny grain with big nutrition. Perfect for idli, dosa, and porridge.", tags: ["millet", "versatile", "organic"] },

        // Oils
        { name: "Wood-Pressed Coconut Oil", slug: "wood-pressed-coconut-oil", categorySlug: "cold-pressed-oils", price: 450, discountedPrice: 399, stock: 80, weight: "1 Litre", featured: true, description: "Extracted using traditional wooden press (Chekku). Pure, unrefined coconut oil with natural fragrance.", benefits: "Boosts immunity, good for skin and hair, antibacterial properties, good cholesterol", ingredients: "100% Organic Cold-Pressed Coconut", nutritionInfo: "100% healthy fats, MCT-rich, no trans fats", tags: ["coconut-oil", "cold-pressed", "chekku", "pure"] },
        { name: "Sesame Oil (Gingelly)", slug: "sesame-oil-gingelly", categorySlug: "cold-pressed-oils", price: 480, discountedPrice: 420, stock: 60, weight: "1 Litre", featured: true, description: "Traditional sesame oil pressed using cold-press method. Rich golden color and authentic flavor.", benefits: "Anti-inflammatory, heart health, rich in antioxidants, good for cooking", ingredients: "100% Organic Sesame Seeds", tags: ["sesame-oil", "cold-pressed", "traditional"] },
        { name: "Groundnut Oil", slug: "groundnut-oil", categorySlug: "cold-pressed-oils", price: 380, discountedPrice: 339, stock: 90, weight: "1 Litre", featured: false, description: "Cold-pressed groundnut oil, naturally cholesterol-free. Great for Indian cooking.", tags: ["groundnut-oil", "cold-pressed", "cooking"] },

        // Sweeteners
        { name: "Palm Jaggery (Karupatti)", slug: "palm-jaggery-karupatti", categorySlug: "natural-sweeteners", price: 280, discountedPrice: 249, stock: 100, weight: "500 g", featured: true, description: "Traditional palm jaggery from Palmyra palm. Rich mineral content, authentic sweet taste.", benefits: "Rich in minerals, iron supplement, aids digestion, natural sweetener", ingredients: "100% Natural Palm Jaggery — no additives", tags: ["jaggery", "karupatti", "traditional", "sweetener"] },
        { name: "Sugarcane Jaggery", slug: "sugarcane-jaggery", categorySlug: "natural-sweeteners", price: 150, discountedPrice: 129, stock: 150, weight: "500 g", featured: false, description: "Pure sugarcane jaggery without any chemicals or bleaching agents.", tags: ["jaggery", "natural", "sweetener"] },

        // Spices
        { name: "Organic Turmeric Powder", slug: "organic-turmeric-powder", categorySlug: "spices", price: 180, discountedPrice: 149, stock: 200, weight: "250 g", featured: true, description: "Single-origin organic turmeric with high curcumin content. Deeply golden, intensely aromatic.", benefits: "Anti-inflammatory, antioxidant rich, immune booster, joint health", ingredients: "100% Organic Turmeric", nutritionInfo: "Curcumin: 3-5% (high grade)", tags: ["turmeric", "organic", "anti-inflammatory", "spice"] },
        { name: "Red Chilli Powder", slug: "red-chilli-powder", categorySlug: "spices", price: 140, discountedPrice: 119, stock: 150, weight: "250 g", featured: false, description: "Pure, stone-ground red chilli powder from sun-dried chillis. No artificial colors.", tags: ["chilli", "spice", "pure"] },
        { name: "Coriander Powder", slug: "coriander-powder", categorySlug: "spices", price: 120, stock: 180, weight: "250 g", featured: false, description: "Stone-ground organic coriander for authentic flavor in curries.", tags: ["coriander", "spice", "organic"] },

        // Herbal
        { name: "Dry Ginger Powder (Sukku)", slug: "dry-ginger-powder-sukku", categorySlug: "herbal-products", price: 220, discountedPrice: 189, stock: 90, weight: "100 g", featured: true, description: "Traditional dry ginger powder for warming teas and digestive health.", benefits: "Digestive health, anti-nausea, warming, joint relief", tags: ["ginger", "herbal", "digestive", "traditional"] },
        { name: "Moringa Leaf Powder", slug: "moringa-leaf-powder", categorySlug: "herbal-products", price: 280, discountedPrice: 249, stock: 70, weight: "100 g", featured: true, description: "Nutrient-dense moringa from fresh leaves. Superfood for daily wellness.", benefits: "Protein-rich, high iron, vitamins A, C, and K, energy booster", ingredients: "100% Organic Moringa Leaves", nutritionInfo: "Protein: 27g, Iron: 28mg, Calcium: 2003mg per 100g", tags: ["moringa", "superfood", "herbal", "nutrition"] },

        // Pulses
        { name: "Black Urad Dal", slug: "black-urad-dal", categorySlug: "pulses", price: 180, discountedPrice: 155, stock: 120, weight: "500 g", featured: false, description: "Whole black urad dal, organically grown. Perfect for idli batter and dal makhani.", tags: ["urad", "pulses", "organic"] },
        { name: "Toor Dal (Yellow Pigeon Peas)", slug: "toor-dal-yellow-pigeon-peas", categorySlug: "pulses", price: 160, discountedPrice: 139, stock: 150, weight: "500 g", featured: false, description: "Organic toor dal for sambar and curries.", tags: ["toor", "dal", "sambar", "organic"] },

        // Dry Fruits
        { name: "Cashews (W240)", slug: "cashews-w240", categorySlug: "dry-fruits", price: 680, discountedPrice: 599, stock: 50, weight: "250 g", featured: true, description: "Premium grade W240 cashews. Naturally sweet, whole, and unprocessed.", tags: ["cashews", "nuts", "premium", "natural"] },
        { name: "Almonds (Badam)", slug: "almonds-badam", categorySlug: "dry-fruits", price: 750, discountedPrice: 699, stock: 60, weight: "250 g", featured: false, description: "Raw, natural almonds without any processing or roasting.", tags: ["almonds", "badam", "natural", "nuts"] },

        // Snacks
        { name: "Millet Mixture (Navarathna Mix)", slug: "millet-mixture-navarathna", categorySlug: "snacks", price: 180, discountedPrice: 149, stock: 80, weight: "200 g", featured: true, description: "Traditional crispy snack made from 9 types of millets. No artificial colors or preservatives.", tags: ["snacks", "millet", "traditional", "healthy"] },
        { name: "Tamarind Rice Mix (Pulikaichal)", slug: "tamarind-rice-mix-pulikaichal", categorySlug: "traditional-foods", price: 160, discountedPrice: 139, stock: 100, weight: "200 g", featured: false, description: "Ready-made traditional tamarind rice paste using authentic recipe.", tags: ["traditional", "tamarind-rice", "ready-mix"] },
    ];

    for (const p of products) {
        const categoryId = createdCategories[p.categorySlug];
        if (!categoryId) continue;

        await prisma.product.upsert({
            where: { slug: p.slug },
            update: {},
            create: {
                name: p.name,
                slug: p.slug,
                description: p.description || null,
                categoryId,
                price: p.price,
                discountedPrice: p.discountedPrice || null,
                stock: p.stock,
                weight: p.weight,
                featured: p.featured || false,
                benefits: (p as { benefits?: string }).benefits || null,
                ingredients: (p as { ingredients?: string }).ingredients || null,
                nutritionInfo: (p as { nutritionInfo?: string }).nutritionInfo || null,
                tags: p.tags || [],
                imageUrls: [],
                rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
                reviewCount: Math.floor(Math.random() * 200) + 5,
            },
        });
    }
    console.log(`✓ ${products.length} products seeded`);

    // Sample newsletter subscriber
    await prisma.newsletterSubscriber.upsert({
        where: { email: "demo@avvai.in" },
        update: {},
        create: { email: "demo@avvai.in" },
    });
    console.log("✓ Sample newsletter subscriber added");

    console.log("\n✅ Avvai database seeded successfully!");
    console.log(`\n🔐 Admin login:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });