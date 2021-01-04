var express = require("express");
var router = express.Router();
const db = require("../../db");
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";

// DEV URL : http://localhost:8080/getSession/verifyCreate
/*const messageBody = {meetupName: sessionName, groupSize: groupSize,  username: username,};*/
router.post("/", function (req, res, next) {
  console.log("/getSession/verifyCreate");
  let groupKey = crypto.randomBytes(16).toString("hex");
  const sessionKey = crypto.randomBytes(16).toString("hex");

  // MongoDB key = sessionName + groupSize + username
  const query = { groupKey: groupKey };

  // Check if the mongoDB database has the specified meetupName, groupSize, and username
  const queryType = "findOne";
  const optionalInsertData = null;

  // ANCHOR MongoDB-verify a new room doesnt already exist
  db.queryMongoDB(
    dbName,
    collectionName,
    query,
    queryType,
    optionalInsertData,
    function (queryResult) {
      // The query is a success- no room by this name exists
      if (queryResult === null) {
        console.log(
          "Query request to create room was successful, creating a room for event: " +
            req.body.meetupName +
            ", and host username: " +
            req.body.username
        );

        // Coookie should provide : username, longitude, latitude, transportation,  status, distance, delay, lastUpdate, joinTime
        let expireTime = new Date(new Date().getTime() + 1000 * 60 * 60 * 4);
        const objectData = {
          groupKey: groupKey,
          meetupName: req.body.meetupName,
          groupSize: req.body.groupSize,
          locationLat: req.cookies.locationLat,
          locationLng: req.cookies.locationLng,
          expireAt: expireTime,
          members: [
            {
              sessionKey: sessionKey,
              username: req.body.username,
              longitude: req.cookies.longitude,
              latitude: req.cookies.latitude,
              status: req.cookies.status,
              transportation: req.cookies.transportation,
              distance: req.cookies.distance,
              delay: req.cookies.delay,
              isHost: true,
              lastUpdate: req.cookies.lastUpdate,
              joinTime: req.cookies.joinTime,
              icon: req.cookies.icon,
            },
          ],
        };

        ///ANCHOR MongoDB: create a room in the database-
        db.queryMongoDB(
          dbName,
          collectionName,
          objectData,
          "insertOne",
          optionalInsertData,
          function (queryResult) {
            /// THe query is a success - no other roome exists with the specified key
            const mySuccessResponse = {
              success: { meetupName: req.body.meetupName, groupSize: req.body.groupSize, userName: req.body.username },
              error: null,
            };

            /// delete cookies for username
            res.cookie("groupKey", groupKey, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
            res.cookie("sessionKey", sessionKey, { maxAge: 4 * 60 * 60 * 1000, httpOnly: true });
            res.cookie("meetupName", req.body.meetupName, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
            res.cookie("isHost", true, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
            res.send(mySuccessResponse);
          },
          function (err) {
            // There was an issue creating the database
            console.log("There was an error creating this room.");
            const myErrorResponse = {
              success: null,
              error: {
                message: "Sorry there was an error with our backend. Please try again later",
              },
            };
            res.send(myErrorResponse);
          }
        );
      } else {
        // A room by this name already exists
        console.log(
          "Query request to create room was unsuccessful - a room with meetupName" +
            req.body.meetupName +
            ", and host name: " +
            req.body.username +
            " already exists"
        );
        // A room with the specified key already exists, please ask the user to input a different name
        const myErrorResponse = {
          success: null,
          error: {
            message: "Meetup name with specified host already exists. Please use a different meetup or host name.",
          },
        };
        res.send(myErrorResponse);
      }
    },
    function (err) {
      // There was an error with the db. initialize
      console.log("Error communicating with mongoDB - getSession/verifyCreate/");
      console.log(err);
      const myErrorResponse = {
        success: null,
        error: {
          message: "Sorry there was an error with our backend. Please try again later",
        },
      };
      res.send(myErrorResponse);
    }
  );
});

module.exports = router;
