const { createConnection } = require("mysql");
class DatabaseManager {
    constructor(dbCreds) {
        this.connection = createConnection({
            host: dbCreds.host,
            user: dbCreds.user,
            password: dbCreds.pass,
            database: dbCreds.db
        });
    }

    connectToDatabase() {
        return new Promise(async resolve => {
            this.connection.connect((err) => {
                if (err) {
                    console.log(`${err}`);
                } else {
                    console.log(`Connected to database.`);
                }
                resolve(err)
            });
        });
    }

    getNumberOfRows(query) {

        return new Promise(async resolve => {
            this.connection.query(query, (err, result) => {
                if (err) {
                    resolve(0)
                } else {
                    resolve(result.length)
                }
            });
        });
    }
}
module.exports = DatabaseManager;