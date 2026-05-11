const { addExtra } = require('../render-service/node_modules/puppeteer-extra');
const StealthPlugin = require('../render-service/node_modules/puppeteer-extra-plugin-stealth');
const puppeteerCore = require('../render-service/node_modules/puppeteer-core');

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');
const https = require('https');

const url = "https://shopee.com.br/2026-Smartwatch-T10-Ultra-3-Nova-S%C3%A9rie-10-SmartWatch-2.09-Inch-HD-49mm-Bluetooth-Com-Calculadora-i.952449950.22797032581?extraParams=%7B%22display_model_id%22%3A238805651418%2C%22model_selection_logic%22%3A3%7D";

function parseIdsFromProductUrl(productUrl) {
  const itemMatch = productUrl.match(/-i\.(\d+)\.(\d+)/i);
  if (itemMatch) {
    return {
      shopId: Number(itemMatch[1]),
      itemId: Number(itemMatch[2]),
    };
  }
  return null;
}

const executableCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

async function getExecutable() {
  for (const candidate of executableCandidates) {
    try {
      await fs.promises.access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error("No browser found");
}

function extractVideoUrlFromInfo(info) {
  if (!info) return "";
  if (typeof info === "string") {
    return /^https?:\/\//i.test(info) ? info : "";
  }
  if (Array.isArray(info)) {
    for (const value of info) {
      const candidate = extractVideoUrlFromInfo(value);
      if (candidate) return candidate;
    }
    return "";
  }
  if (typeof info !== "object") return "";

  const preferredKeys = ["video_url", "play_url", "url", "src", "mp4", "default_play_url", "default_format", "play_addr"];

  for (const key of preferredKeys) {
    if (!(key in info)) continue;
    const candidate = extractVideoUrlFromInfo(info[key]);
    if (candidate) return candidate;
  }
  for (const [key, value] of Object.entries(info)) {
    if (/url|src|play|mp4/i.test(key)) {
      const candidate = extractVideoUrlFromInfo(value);
      if (candidate) return candidate;
    }
  }
  for (const value of Object.values(info)) {
    const candidate = extractVideoUrlFromInfo(value);
    if (candidate) return candidate;
  }
  return "";
}

function extractApiVideoUrl(item) {
  const videoList = Array.isArray(item?.video_info_list) ? item.video_info_list : [];
  for (const videoInfo of videoList) {
    const candidate = extractVideoUrlFromInfo(videoInfo);
    if (candidate) return candidate;
  }
  return "";
}

async function run() {
  const ids = parseIdsFromProductUrl(url);
  const apiUrl = `https://shopee.com.br/api/v4/item/get?shopid=${ids.shopId}&itemid=${ids.itemId}`;
  
  const execPath = await getExecutable();
  
  // Stealth + non-headless usually works best for Datadome
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: false, 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    
    // We can also try intercepting the request
    let apiData = null;
    page.on('response', async (response) => {
      const reqUrl = response.url();
      if (reqUrl.includes('/api/v4/item/get')) {
        try {
          const text = await response.text();
          const json = JSON.parse(text);
          if (json.data && !json.error) {
             apiData = json;
             console.log("Intercepted valid /api/v4/item/get response from Shopee frontend!");
          }
        } catch(e) {}
      }
    });

    console.log("Going to Shopee product page...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("Waiting for Datadome/Cloudflare to clear and page to load...");
    await new Promise(r => setTimeout(r, 8000));

    if (!apiData) {
        console.log("Did not intercept frontend request, trying manual fetch via page.evaluate...");
        const result = await page.evaluate(async (requestUrl) => {
          try {
            const res = await fetch(requestUrl, { credentials: "omit" }); // Shopee sometimes blocks same-origin
            return { ok: res.ok, status: res.status, text: await res.text() };
          } catch (err) {
            return { error: err.message };
          }
        }, apiUrl);

        if (result.text) {
           const json = JSON.parse(result.text);
           if (json.data && !json.error) apiData = json;
           else console.log("Manual fetch returned error:", json.error || result.text.substring(0,200));
        }
    }

    if (!apiData) {
        console.error("Failed to get API data through interception and manual fetch.");
        return;
    }

    const item = apiData?.data?.item || apiData?.data;
    console.log("Item Title:", item?.name);

    const videoUrl = extractApiVideoUrl(item);
    if (!videoUrl) {
      console.error("No video URL found in API response");
      return;
    }

    console.log("Found Video URL:", videoUrl);
    const destPath = path.join(__dirname, "downloaded_video.mp4");
    console.log("Downloading to:", destPath);

    const file = fs.createWriteStream(destPath);
    https.get(videoUrl, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close();
        console.log("Download complete!");
      });
    }).on('error', function(err) {
      fs.unlink(destPath, () => {});
      console.error("Error downloading file:", err.message);
    });

  } finally {
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
  }
}

run().catch(console.error);
