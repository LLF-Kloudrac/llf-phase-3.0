const { Pool } = require('pg');

const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
}

console.log('process.env.DATABASE_URL i dbConn: ' + process.env.DATABASE_URL);

const poolConn = new Pool(dbConfig);

poolConn.on('error', function (err) {
    console.log('Error Message' + err.message);
    console.log('Error Stack' + err.stack);
})

module.exports = poolConn;