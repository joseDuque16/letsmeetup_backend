var express = require("express");
var router = express.Router();
const db = require("../../db");
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";

//DEV URL : http://localhost:8080/getSession/sendUpdate
//ANCHOR - router.post(sendUpdate) - updates server on user locational changes
router.post("/", function (req, res, next) {
  console.log("/getSession/sendUpdate");
  const query = { groupKey: req.cookies.groupKey };
  const curTime = new Date().getTime();

  //ANCHOR -MongoDB check the room trying to join is ready to receive a new member
  db.queryMongoDB(
    dbName,
    collectionName,
    query,
    "findOne",
    null,
    function (queryResult) {
      // Logic to append the new user data to the existing object
      // grab username from new member
      var membersData = queryResult.members;
      for (var i = 0; i < membersData.length; i++) {
        if (membersData[i].sessionKey === req.cookies.sessionKey) {
          membersData[i].longitude = req.cookies.longitude;
          membersData[i].latitude = req.cookies.latitude;
          membersData[i].status = req.cookies.status;
          membersData[i].transportation = req.cookies.transportation;
          membersData[i].delay = req.cookies.delay;
          membersData[i].joinTime = req.cookies.joinTime;
          membersData[i].dinstance = req.cookies.dinstance;
          membersData[i].lastUpdate = curTime;
          break;
        }
      }

      const InsertData = { $set: queryResult };
      console.log("updating member data" + queryResult);

      //ANCHOR -MongoDB run query to insert the new member data into the group
      db.queryMongoDB(
        dbName,
        collectionName,
        query,
        "updateOne",
        InsertData,
        function (queryResult2) {
          // Successfully inserted user map data into the database, respond with the map data for the group
          res.cookie("lastUpdate", curTime, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });

          const mySuccessResponse = {
            success: true,
            error: null,
            members: queryResult.members,
          };
          res.send(mySuccessResponse);
        },
        function (error) {
          //ANCHOR MongoDB response- there was an issue trying to update the group with the member data
          // TODO Clear all the cookies and ask the user to try again (possibly an issue with the groupKey or insert info)
          const myErrorResponse = {
            success: null,
            error: {
              message: "There was an issue trying to update the group with the member data",
            },
          };
          res.send(myErrorResponse);
        }
      );
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
