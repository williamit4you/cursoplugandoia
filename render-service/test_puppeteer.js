const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const puppeteerCore = require('puppeteer-core');
puppeteerExtra.use(StealthPlugin());

(async () => {
  const browser = await puppeteerExtra.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  });
  const page = await browser.newPage();
  
  let itemApiData = null;
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/v4/item/get')) {
      try {
        const json = await response.json();
        console.log("INTERCEPTED /api/v4/item/get!");
        itemApiData = json;
      } catch (e) {
        console.log("Failed to parse response:", e);
      }
    }
  });

  console.log("Navigating...");
  await page.goto("https://shopee.com.br/Caixa-Som-Bluetooth-Torre-Port%C3%A1til-Fm-Mp3-Usb-Sd-20W-i.883941882.19699301648", { waitUntil: 'networkidle2' });
  console.log("Navigated. Waiting 5s...");
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Item API Data keys:", itemApiData ? Object.keys(itemApiData) : null);
  await browser.close();
})();
