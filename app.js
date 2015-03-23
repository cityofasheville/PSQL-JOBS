var yaml = require('yamljs');
var pg = require('pg');
var fs = require('fs');
var exec = require('child_process').exec;

// Load yaml file using YAML.load 
nativeObject = yaml.load('config/config.yml');

obj = nativeObject.databases
for (var prop in obj) {
  aQuerys = obj[prop].preparedStatments;
  aSQLFiles = obj[prop].sqlFiles;
  
  client = new pg.Client(obj[prop])
  client.on('drain', client.end.bind(client)) 
  client.connect(function(err, client, done){
    if(err) {
      // this should print "error: AND ERROR MESSAGE FROM POSTGRES"
      console.error("%s", err);
    }
  });
 
  for (var aQuery in aQuerys){
    var query = client.query(aQuerys[aQuery], function(err, result) {
      if(err) {
        // this should print "error: AND ERROR MESSAGE FROM POSTGRES"
        console.error("%s", err);
        };
      });
    
    query.on('end', function(result) {
      //fired once and only once, after the last row has been returned and after all 'row' events are emitted
      //in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
      console.log(result.rowCount + ' rows were received');
    })
  }


pg.end();

  for (var aSQLFile in aSQLFiles){
    console.log(aSQLFiles[aSQLFile])
    envPG = {};
    envPG['PGPASSWORD'] = obj[prop].password;

	var spawn = require('child_process').spawn,
	    sql    = spawn('/usr/pgsql-9.2/bin/psql', ['-U'+obj[prop].user,'-h'+obj[prop].host,'-d'+obj[prop].database,'-f'+aSQLFiles[aSQLFile].file],{env: envPG});

	sql.stdout.on('data', function (data) {
	  console.log('stdout: ' + data);
	});

	sql.stderr.on('data', function (data) {
	  console.log('stderr: ' + data);
	});

	sql.on('close', function (code) {
	  console.log('child process exited with code ' + code);
	});
   
  }

};


