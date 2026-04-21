const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  client.query('SELECT * FROM "SocialPost"').then(res => {
    console.log('ROWS:', res.rowCount);
    console.log(res.rows);
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
});
