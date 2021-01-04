var express = require("express");
var router = express.Router();
const db = require("../../db");
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";

// DEV URL : http://localhost:8080/getSession/joinMeetup
//ANCHOR - joins the meetup by creating a new member
router.post("/", function (req, res, next) {
  console.log("/getSession/joinMeetup");
  const groupKey = req.cookies.groupKey;
  const query = { groupKey: groupKey };
  const optionalInsertData = null;
  const curTime = new Date().getTime();

  //ANCHOR -MongoDB check the room trying to join is ready to receive a new member
  db.queryMongoDB(
    dbName,
    collectionName,
    query,
    "findOne",
    optionalInsertData,
    function (queryResult) {
      // Respond back to the user with all of the information needed to map the users
      if (queryResult !== null) {
        // check that the room is not already full
        if (queryResult.members.length >= queryResult.groupSize) {
          console.log("Sorry the room you tried to enter is full. Ask the host to increase the room size");
          const myErrorResponse = {
            success: null,
            error: {
              message: "Sorry the room you tried to enter is full. Ask the host to increase the room size",
            },
          };
          res.send(myErrorResponse);
        } else {
          // Logic to append the new user data to the existing object
          // grab username from new member
          const sessionKey = crypto.randomBytes(16).toString("base64");
          const memberInfo = {
            sessionKey: sessionKey,
            username: req.body.username,
            longitude: req.cookies.longitude,
            latitude: req.cookies.latitude,
            status: req.cookies.status,
            transportation: req.cookies.transportation,
            distance: req.cookies.distance,
            delay: req.cookies.delay,
            isHost: false,
            lastUpdate: req.cookies.lastUpdate,
            joinTime: req.cookies.joinTime,
            icon: req.cookies.icon,
          };
          queryResult.members.push(memberInfo);
          const InsertData = { $set: queryResult };
          console.log("new member data being pushed into group" + queryResult);

          //ANCHOR -MongoDB run query to insert the new member data into the group
          db.queryMongoDB(
            dbName,
            collectionName,
            query,
            "updateOne",
            InsertData,
            function (queryResult2) {
              // Successfully inserted user map data into the database, respond with the map data for the group
              res.cookie("groupKey", queryResult.groupKey, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
              res.cookie("sessionKey", sessionKey, { maxAge: 4 * 60 * 60 * 1000, httpOnly: true });
              res.cookie("meetupName", queryResult.meetupName, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
              res.cookie("joinTime", curTime, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
              res.cookie("lastUpdate", curTime, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
              res.cookie("isHost", false, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });

              const mySuccessResponse = {
                success: true,
                error: null,
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
        }
      } else {
        //ANCHOR Query result returned null - group key does not exist - either the group was closed or it timed out
        const myErrorResponse = {
          success: null,
          error: {
            message: "Group key does not exist - either the group was closed or it timed out",
          },
        };
        res.send(myErrorResponse);
      }
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
