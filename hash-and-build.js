const bcrypt = require("bcryptjs");
const fs = require("fs");
const hash = bcrypt.hashSync(process.env.NEW_PASSWORD, 12);
const sql = 'UPDATE "User" SET "passwordHash" = \'' + hash + '\' WHERE email = \'admin@opsshield.io\';';
fs.writeFileSync("/tmp/update.sql", sql);
