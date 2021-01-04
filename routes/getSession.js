var express = require("express");
var router = express.Router();
var crypto = require("crypto");
const dbName = "letsMeetupSessions";
const collectionName = "activeSessions";
var app = express();
var updateDataHandler = require("./getSession/updateData");
var sendUpdateHandler = require("./getSession/sendUpdate");
var joinMeetupHandler = require("./getSession/joinMeetup");
var verifyJoinHandler = require("./getSession/verifyJoin");
var verifyCreateHandler = require("./getSession/verifyCreate");

// ANCHOR - Handles updating the user to all of the members locations
app.use("/updateData", updateDataHandler);

// ANCHOR - Handles sending updates to the server when a change in position occurs
app.use("/sendUpdate", sendUpdateHandler);

// ANCHOR - handles a new member joining the group
app.use("/joinMeetup", joinMeetupHandler);

// ANCHOR - handles checking that the meetup exists and is not full
app.use("/verifyJoin", verifyJoinHandler);

// ANCHOR - handles creating new meetup events
app.use("/verifyCreate", verifyCreateHandler);

module.exports = app;
