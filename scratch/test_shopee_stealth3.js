const { addExtra } = require('../render-service/node_modules/puppeteer-extra');
const StealthPlugin = require('../render-service/node_modules/puppeteer-extra-plugin-stealth');
const puppeteerCore = require('../render-service/node_modules/puppeteer-core');

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());

const url = "https://shopee.com.br/2026-Smartwatch-T10-Ultra-3-Nova-S%C3%A9rie-10-SmartWatch-2.09-Inch-HD-49mm-Bluetooth-Com-Calculadora-i.952449950.22797032581?extraParams=%7B%22display_model_id%22%3A238805651418%2C%22model_selection_logic%22%3A3%7D";

const executableCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

async function run() {
  const fs = require('fs');
  let execPath = "";
  for (const candidate of executableCandidates) {
    try { await fs.promises.access(candidate); execPath = candidate; break; } catch {}
  }

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
      const reqUrl = response.url();
      if (reqUrl.includes('/api/v4/') || reqUrl.includes('graphql')) {
        try {
          const text = await response.text();
          if (text.includes("video_info_list") || text.includes("video_url") || text.includes("play_url")) {
             console.log("FOUND VIDEO IN URL:", reqUrl);
             console.log("RESPONSE:", text.substring(0, 500));
          }
        } catch(e) {}
      }
    });

    console.log("Going to Shopee product page...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise(r => setTimeout(r, 10000));
    
    const html = await page.content();
    fs.writeFileSync("scratch/shopee_debug.html", html);
    console.log("Saved HTML to scratch/shopee_debug.html. Look for video_info_list inside.");

  } finally {
    await browser.close();
  }
}

run().catch(console.error);
