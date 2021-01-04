var express = require("express");
var router = express.Router();
const db = require("../../db");
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";

//DEV URL : http://localhost:8080/getSession/updateData
//ANCHOR - router.get(getUpdates) - grabs all member information
router.get("/", function (req, res, next) {
  console.log("/getSession/updateData");
  const groupKey = req.cookies.groupKey;
  const optionalInsertData = null;
  const query = { groupKey: groupKey };

  //ANCHOR -MongoDB get updates on locational data
  db.queryMongoDB(
    dbName,
    collectionName,
    query,
    "findOne",
    optionalInsertData,
    function (queryResult) {
      // Respond back to the user with all of the information needed to map the users
      const mySuccessResponse = {
        success: true,
        error: null,
        members: queryResult.members,
        locationLat: queryResult.locationLat,
        locationLng: queryResult.locationLng,
      };
      res.send(mySuccessResponse);
    },
    function (error) {
      // Join Meetup findOne resulted in an error
      console.log("There was an error in finding the specified groupKey in the database");
      const myErrorResponse = {
        success: null,
        error: {
          message: "There was an error in finding the specified groupKey in the database",
        },
      };
      res.send(myErrorResponse);
    }
  );
});

module.exports = router;
