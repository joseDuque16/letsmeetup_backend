const MongoClient = require("mongodb").MongoClient;

const dbConnectionUrl =
  "mongodb+srv://jduque:jduque@cluster0.s4kbu.mongodb.net/sample_airbnb?retryWrites=true&w=majority";

function initialize(dbName, dbCollectionName, successCallback, failureCallback) {
  MongoClient.connect(dbConnectionUrl, { useUnifiedTopology: true }, function (err, dbInstance) {
    if (err) {
      console.log(`[MongoDB connection] ERROR: ${err}`);
      failureCallback(err); // this should be "caught" by the calling function
    } else {
      const dbObject = dbInstance.db(dbName);
      const dbCollection = dbObject.collection(dbCollectionName);
      console.log("[MongoDB connection] SUCCESS");

      successCallback(dbCollection);
    }
  });
}

async function queryMongoDB(dbName, collectionName, query, queryType, insertData, callback, callbackErr) {
  // query to see if the mongoRoomKey exists
  initialize(
    dbName,
    collectionName,
    function (dbCollection) {
      // successCallback
      // Query type = Get one item only
      if (queryType === "findOne") {
        dbCollection.findOne(query, function (err, result) {
          console.log(err);
          callback(result);
        });
      }

      if (queryType === "insertOne") {
        dbCollection.insertOne(query, function (err, result) {
          console.log(err);
          callback(result);
        });
      }

      if (queryType === "updateOne") {
        dbCollection.updateOne(query, insertData, function (err, result) {
          console.log(err);
          callback(result);
        });
      }

      // << db CRUD routes >>
    },
    function (err) {
      // failureCallback
      console.log(err);
      callbackErr(err);
    }
  );
}

module.exports = {
  queryMongoDB,
};
