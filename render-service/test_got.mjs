import { gotScraping } from 'got-scraping';

async function run() {
  try {
    const res = await gotScraping({
      url: 'https://shopee.com.br/api/v4/item/get?shopid=952449950&itemid=22797032581',
      responseType: 'text'
    });
    console.log(res.body.substring(0, 200));
  } catch (err) {
    console.error(err);
  }
}
run();
