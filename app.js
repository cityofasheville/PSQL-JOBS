var yaml = require('yamljs');
var pg = require('pg');
var fs = require('fs');

// Load yaml file using YAML.load 
nativeObject = yaml.load('config/config.yml');

obj = nativeObject.databases
for (var prop in obj) {
  aQuery = obj[prop].preparedStatments[0];

  var client = new pg.Client(obj[prop])
  client.on('drain', client.end.bind(client)) 
  client.connect(function(err, client, done){
    if(err) {
      // this should print "error: canceling statement due to user request"
      console.error("%s", err);
    }
  });
  
  var first = client.query(aQuery, function(err, result) {
    if(err) {
      // this should print "error: canceling statement due to user request"
      console.error("%s", err);
    };
    //console.log(result);
  });
  first.on('row', function(row) {
     console.log(row.address);
  });
};
