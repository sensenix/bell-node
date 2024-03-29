const express = require("express");
const bodyParser = require("body-parser");
const os = require("os");
const config = require("./app/config/config");
const helper = require("./app/controllers/helperfunc.js").data;

const hostname = os.hostname().toLowerCase();

const cluster = require('cluster'); // 
const totalCPUs = config.workers; //

//function sleepFor(sleepDuration){
//    var now = new Date().getTime();
//    while(new Date().getTime() < now + sleepDuration){ /* Do nothing */ }
//}

if (cluster.isMaster) {

  // set port, listen for requests
  const PORT = config.PORT;
  cluster.schedulingPolicy = cluster.SCHED_RR; // round robin

  console.log('')
  console.log('Bell server v0.73 \033[32m https://actionatdistance.com \033[0m*********************')
  console.log('\033[33mServer is running on port \033[31m' + PORT + '\033[0m');
  console.log('\033[33mScripts directory is \033[31m' + config.scripts_directory + '\033[0m');
  console.log('\033[33mNumber of workers is \033[31m' + totalCPUs + '\033[0m');
  console.log('\033[33mWork directory is \033[31m' + config.work_directory + '\033[0m');
  
  helper.clean_dir(config.work_directory);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log("\033[33mRestarting failed worker " + process.pid + " \033[0m");
    cluster.fork();
  });

} else {
  start();
}

function start() {

  const app = express();
  const fs = require('fs');

  // parse requests of content-type - application/json
  app.use(bodyParser.json());

  // parse requests of content-type - application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));

  // simple route
  app.get("/", function (req, res) {
    res.json({ message: "Welcome to Bell server application." + process.pid.toString() });
  });

  // routes
  require('./app/routes/auth.routes')(app);
  require('./app/routes/user.routes')(app);

  // set port, listen for requests
  const PORT = config.PORT;
  let wdir = config.work_directory + '/' + process.pid.toString();
  fs.mkdir(wdir, { recursive: true }, (err) => {
    if (err) { return console.error(err); }
    console.log('\033[33mCreating directory \033[31m' + wdir + '\033[0m');
  });
  app.listen(PORT, () => {
    console.log('\033[33mListening on \033[31m' + PORT + "\033[33m PID = \033[31m" + process.pid + '\033[0m')
  });
}

function initial() {
}

