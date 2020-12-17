const cookieParser = require("cookie-parser");
var express = require("express");
var router = express.Router();
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";
const db = require("../db");

router.post("/", function (req, res, next) {
  console.log(req.body);
  console.log("url request");
  const out = { success: true };
});

//ANCHOR - router.get(getUpdates) - grabs all member information
router.get("/updateData", function (req, res, next) {
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

//ANCHOR - router.post(sendUpdate) - updates server on user locational changes
router.post("/sendUpdate", function (req, res, next) {
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

// Status - Testing
//ANCHOR - router.post(verifyJoin)
router.post("/joinMeetup", function (req, res, next) {
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

// Status - Working (12/17/2020)
// ANCHOR - router.post(verifyJoin)
router.post("/verifyJoin/", function (req, res, next) {
  // setup to query the received session id
  query = { groupKey: req.body.groupKey };
  const optionalInsertData = null;
  console.log(query);
  queryType = "findOne";

  //ANCHOR MongoDB- verify sessionID exists
  db.queryMongoDB(
    dbName,
    collectionName,
    query,
    queryType,
    optionalInsertData,
    function (queryResult) {
      // session found successfully - set the cookies
      if (queryResult !== null) {
        const mySuccessResponse = {
          success: true,
          error: null,
        };
        console.log(queryResult);

        // Set the cookies for the user
        res.cookie("groupKey", queryResult.groupKey, { maxAge: 4 * 60 * 60 * 1000, httpOnly: false });
        console.log("Specified room URL exist!");
        res.send(mySuccessResponse);
      } else {
        // The sessionID does not exist in mongoDB
        const myErrorResponse = {
          success: null,
          error: {
            message: "The specified sessionID (joinurl) in verifyJoin does not exist in mongoDB - possible timed out",
          },
        };
        console.log("The specified sessionID (joinurl) in verifyJoin does not exist in mongoDB - possible timed out");
        res.send(myErrorResponse);
      }
    },
    function (error) {
      // there was an error fetching from mongoDB
      const myErrorResponse = {
        success: null,
        error: { message: "There was an error fetching the specified sessionID on the verifyJoin/ backend" },
      };
      console.log("There was an error fetching the specified sessionID on the verifyJoin/ backend");
      res.send(myErrorResponse);
    }
  );
});

// Status - Working (12/17/2020)
// ANCHOR - router.post(verifyCreate)
// http://localhost:8080/getSession/verifyCreate
/*const messageBody = {meetupName: sessionName, groupSize: groupSize,  username: username,};*/
router.post("/verifyCreate/", function (req, res, next) {
  let groupKey = crypto.randomBytes(16).toString("base64");
  const sessionKey = crypto.randomBytes(16).toString("base64");
  groupKey = groupKey.replaceAll("=", "equals");
  groupKey = groupKey.replaceAll("/", "slash");
  groupKey = groupKey.replaceAll("\\", "backslash");
  groupKey = groupKey.replaceAll("%", "percent");

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
