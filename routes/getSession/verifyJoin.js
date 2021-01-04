var express = require("express");
var router = express.Router();
const db = require("../../db");
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";

// DEV URL : http://localhost:8080/getSession/verifyJoin
// ANCHOR - verifies that the meetup exists and is not full
router.post("/", function (req, res, next) {
  console.log("/getSession/verifyJoin");
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

module.exports = router;
