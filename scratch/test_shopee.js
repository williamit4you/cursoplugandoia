const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const { searchShopeeAffiliateProducts } = await import('./lib/shopee/openApi.js');
  const config = await prisma.shopeeAffiliateConfig.findFirst();
  
  if (!config) {
    console.log("No config found in DB");
    return;
  }
  
  console.log("Using config:", { appId: config.appId, domain: config.domain });
  
  try {
    const products = await searchShopeeAffiliateProducts(config, {
      keyword: "fone bluetooth",
      limit: 5,
      minPrice: 10,
      minCommissionRate: 5,
      minSales: 10,
      enrichDetails: false
    });
    
    console.log("Products found:", products.length);
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error("Error searching products:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
