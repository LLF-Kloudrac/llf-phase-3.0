const {Pool,Client} = require('pg')

const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl:true,
  }

console.log('process.env.DATABASE_URL: '+process.env.DATABASE_URL);

const pool = new Pool(dbConfig);
pool.on('error',function(err){
    console.log('Error Message'+err.message);
    console.log('Error Stack'+err.stack);
})

pool.query('SELECT Id, sfid, Name, email,PM_email__c FROM salesforce.Contact where id=1', function (err, result) {
    console.log("err", err);
    console.log("result ", result);
})

module.exports = {
    pool,
    query: (text, params, callback) =>{
        return pool.query(text, params, callback)
    }
}