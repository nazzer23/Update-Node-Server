require("dotenv").config();
const {MySQL_HOST, MySQL_USER, MySQL_PASS, MySQL_DB} = process.env;

const WebSocket = require('ws')
let wss;

const DatabaseManager = require('./DatabaseManager.js');
let database;
const databaseInfo = {
    "host": MySQL_HOST,
    "user": MySQL_USER,
    "pass": MySQL_PASS,
    "db": MySQL_DB
};

function init() {
    database = new DatabaseManager(databaseInfo);
    database.connectToDatabase().then((err) => {
        if(!err) {
            initWebSocket();
        } else {
            console.log("Startup Failure")
        }
    });
}

function initWebSocket() {
    wss = new WebSocket.Server({ port: 8080 })

    wss.on('connection', ws => {

        let user = {
            "authenticated": false
        };

        let checkNotifications = new Promise(async resolve => {
            let resp = {
                "cmd": "updateNotifications",
                "data": {
                    "notifCount": "oops",
                    "msgCount": "WIP",
                    "friendCount": "WIP"
                }
            }
            database.getNumberOfRows(`SELECT * FROM users_friends_requests WHERE UserID='${user.id}'`).then(result => {
                // Friend Count
                resp["data"]["friendCount"] = result;

                // Get User Messages
                resp["data"]["msgCount"] = "WIP";

                // User Notifications
                database.getNumberOfRows(`SELECT * FROM users_notifications WHERE UserID='${user.id}' AND ReadNotif=0`).then(result => {
                    resp["data"]["notifCount"] = result;
                    resolve(resp);
                });
            });
        })

        let updateNotifications = () => {
            if (user.authenticated) {

                checkNotifications.then(function (resp) {
                    ws.send(JSON.stringify(resp));
                });
            } else {
                console.log("Not authenticated");
            }
        };

        // Request UserID and Session String
        ws.send(JSON.stringify({ "cmd": "sessionRequest" }));
        ws.on('message', message => {
            console.log(`Received message => ${message}`);

            if (IsJsonString(message)) {

                let resp = JSON.parse(message);
                switch (resp.cmd) {
                    case "authUser":
                        let sessionString = resp.data.token;
                        let userID = resp.data.userid;
                        database.connection.query(`SELECT * FROM users_sessions WHERE SessionString='${sessionString}' AND UserID='${userID}' AND Valid=1`, (err, row) => {
                            if (row.length === 0 || err) {
                                ws.close();
                            } else {
                                user["authenticated"] = true;
                                user["id"] = userID;
                                user["token"] = sessionString;
                            }
                            ws.send(
                                JSON.stringify(
                                    {
                                        "cmd": "auth",
                                        "success": user["authenticated"]
                                    }
                                )
                            )
                        });
                        break;

                    case "getNotifications":
                        updateNotifications();
                        break;
                }

            }
        })

    });
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

init();