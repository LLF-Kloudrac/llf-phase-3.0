const { Pool, Client } = require('pg')

const dbConn = {};

dbConn.connect = function connect(cb) {
    console.log("db conn called");
    const dbConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    }

    console.log('process.env.DATABASE_URL: ' + process.env.DATABASE_URL);

    const pool = new Pool(dbConfig);
    pool.on('error', function (err) {
        console.log('Error Message' + err.message);
        console.log('Error Stack' + err.stack);
        return cb(false);
    })

    dbConn.pool = pool;
    return cb(true);
}

module.exports = dbConn;

// module.exports = {
//     pool,
//     query: (text, params, callback) =>{
//         return pool.query(text, params, callback)
//     }
// }