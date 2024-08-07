const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect(
        'mongodb+srv://karinev:AsDfGh2023@cluster0.y3q3rgn.mongodb.net/shop-app'
    ).then(client => {
        console.log('Connected!');
        _db = client.db();
        callback(client);
    }).catch( err => {
        console.log(err);
    });
}

const getDb = () => {
    if(_db) {
        return _db;
    }
    throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;