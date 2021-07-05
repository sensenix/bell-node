const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const os = require("os");

const app = express();
const hostname = os.hostname().toLowerCase();

var corsOptions = {
//  origin: `http://${hostname}:8081`
    origin: `*`
};

app.use(cors(corsOptions));

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
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
}