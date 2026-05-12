const https = require('https');

const url = 'https://shopee.com.br/api/v4/item/get?shopid=952449950&itemid=22797032581';

https.get(url, {
  headers: {
    'User-Agent': 'WhatsApp/2.21.12.21 A',
    'Accept': '*/*'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 200)));
});
