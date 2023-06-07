// Licensed Materials - Property of IBM
//
// SAMPLE
//
// (c) Copyright IBM Corp. 2019 All Rights Reserved
//
// US Government Users Restricted Rights - Use, duplication or
// disclosure restricted by GSA ADP Schedule Contract with IBM Corp

const express = require('express');
const axios = require('axios');

var bodyParser = require('body-parser');
var os = require('os');
var util = require('util');
var dns = require('dns');
var app = express();

app.use(bodyParser.json());

// Read in variables
var port = process.env.PORT || 8080;
var apiScheme = process.env.API_SCHEME || 'http';
var apiHost = process.env.API_HOST || 'zt01.mop.ibm';
var apiPort = process.env.API_PORT || '9080';
var apiContextRoot = process.env.API_CONTEXT_ROOT || '';
var apiLogLevel = process.env.API_LOG_LEVEL || 'INFO';

// Global axios defaults
axios.defaults.baseURL = apiScheme + '://' + apiHost + ':' + apiPort + apiContextRoot;

var server = app.listen(port, function () {
  console.log('This application is running on platform: ' + process.platform);
  console.log('API requests from this application will call a z/OS Connect API Server using URI: ' + axios.defaults.baseURL);

  dns.lookup(os.hostname(), { hints: dns.ADDRCONFIG }, function (err, ip) {
    if (err || ip == undefined || ip == null) {
      ip = 'localhost'
    }

    console.log('This application is listening for requests at URI: http://' + ip + ':' + port + '/');
  });
});

process.on('SIGTERM', function () {
  server.close(function () {
    console.log('Received SIGTERM at ' + (new Date()));
  });
});

// Serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// If using npm versions of frameworks, redirect
app.use('/angular', express.static(__dirname + '/node_modules/angular'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));

// jQuery calls this URL, this function calls two REST APIs, merges the responses and sends it to the client
app.get('/catalogManager/items', function (req, res) {
  // Create empty array
  var itemsArray = [];

  let itemsPath1 = '/items?startItemID=10'
  let itemsPath2 = '/items?startItemID=160'

  console.log('API Request:  Get first set of items using GET ' + axios.defaults.baseURL + itemsPath1);

  var promise1 = axios.get(itemsPath1)
    .then(function (response) {
      console.log('API Response: Get first set of items returned ' + response.data.totalItems + ' items ');
      if (apiLogLevel == "DEBUG") {
         console.dir(response.data.items)
      }
      itemsArray = itemsArray.concat(response.data.items);      
    })
    .catch(function (error) {
      console.log(error.toJSON());
    })
    .finally(function () {
      // always executed
    });

  console.log('API Request:  Get second set of items using GET ' + axios.defaults.baseURL + itemsPath2);

  var promise2 = axios.get(itemsPath2)
    .then(function (response) {
      console.log('API Response: Get second set of items returned ' + response.data.totalItems + ' items ');
      if (apiLogLevel == "DEBUG") {
         console.dir(response.data.items)
      }
      itemsArray = itemsArray.concat(response.data.items);      
    })
    .catch(function (error) {
      console.log(error.toJSON());
    })
    .finally(function () {
      // always executed
    });

  // When both responses come back, send the array of items to client
  Promise.all([promise1, promise2])
    .then(values => {
      res.send(JSON.stringify(itemsArray));
    })
    .catch(function (error) {
      console.log('Error during GET all items: ' + error);
      res.status(500);
    });

});

// Buying POST function
app.post('/catalogManager/buy/:id/:numberOfItems', function (req, res) {

  let ordersPath = '/orders?itemNumber=' + req.params.id + '&quantity=' + req.params.numberOfItems

  console.log('API Request:  Buy items using POST ' + axios.defaults.baseURL + ordersPath);

  axios.post(ordersPath)
    .then(function (response) {
      console.log('API Response: Buy items API returned: ' + response.status + ' ' + response.statusText);
      console.log(response.data);
      res.send(JSON.stringify(response.data));
      // return response;
    })
    .catch(function (error) {
      console.log(error.toJSON());
      res.send(JSON.stringify(error.message));
    });
});

// Get information about the Node.js environment
app.get('/about/environment', function (req, res) {
  // Send a simple response to the client
  res.send(
    '<html>'
    + '<h1>Node.js runtime environment</h1>'
    + '<p>'
    + 'Date: ' + new Date() + '<br>'
    + '<pre>'
    + 'process.execPath: ' + process.execPath + '<br>'
    + 'process.argv[0]: ' + process.argv[0] + '<br>'
    + 'process.version: ' + process.version + '<br>'
    + 'process.cwd(): ' + process.cwd() + '<br>'
    + 'process.umask(): ' + process.umask().toString(8) + '<br>'
    + 'process.getuid(): ' + process.getuid() + '<br>'
    + 'process.geteuid(): ' + process.geteuid() + '<br>'
    + 'process.getgid(): ' + process.getgid() + '<br>'
    + 'process.getegid(): ' + process.getegid() + '<br>'
    + 'process.getgroups(): ' + process.getgroups() + '<br>'
    + '<br>'
    + 'os.hostname(): ' + os.hostname() + '<br>'
    + 'os.platform(): ' + os.platform() + '<br>'
    + 'os.release(): ' + os.release() + '<br>'
    + 'os.type(): ' + os.type() + '<br>'
    + 'os.arch(): ' + os.arch() + '<br>'
    + 'os.homedir(): ' + os.homedir() + '<br>'
    + 'os.tmpdir(): ' + os.tmpdir() + '<br>'
    + 'os.totalmem(): ' + os.totalmem() + '<br>'
    + 'os.freemem(): ' + os.freemem() + '<br>'
    + 'os.uptime(): ' + os.uptime() + '<br>'
    + '</pre>'
    + '<h2>os.userInfo()</h2><pre>' + (util.inspect(os.userInfo())) + '</pre>'
    + '<h2>process.env</h2><pre>' + (util.inspect(process.env)) + '</pre>'
    + '<h2>process.memoryUsage()</h2><pre>' + (util.inspect(process.memoryUsage())) + '</pre>'
    + '<h2>os.cpus()</h2><pre>' + (util.inspect(os.cpus())) + '</pre>'
    + '<h2>os.networkInterfaces()</h2><pre>' + (util.inspect(os.networkInterfaces())) + '</pre>'
    + '<h2>process</h2><pre>' + (util.inspect(process)) + '</pre>'
    + '</html>'
  );
});
