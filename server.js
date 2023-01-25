const express = require("express");
const bodyParser = require("body-parser");
const os = require("os");
const config = require("./app/config/config");

const app = express();
const hostname = os.hostname().toLowerCase();

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Bell server application." });
});

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);

// set port, listen for requests
const PORT = config.PORT;

console.log('')
console.log('Bell server v0.53 \033[32m https://actionatdistance.com \033[0m*********************')
app.listen(PORT, () => {
  console.log('\033[33mServer is running on port ' + PORT + '\033[0m');
  console.log('')
});

function initial() {
}

