var yaml = require('yamljs');
var pg = require('pg');

// Load yaml file using YAML.load 
nativeObject = yaml.load('config/config.yml');

//console.log(JSON.stringify(nativeObject.databases.length));
obj = nativeObject.databases
for (var prop in obj) {
  //host = obj['host'];
  //database = obj['databbase'];
  //console.log(host + database)
 //console.log(obj[prop]);
 childobj =  obj[prop];
 console.log(childobj.host + '-' + childobj.database);
 
 //for (var childprop in childobj) {
  //console.log(childprop);
  //console.log(childobj[childprop]); 
 //  dbObj =  childobj;
 //  console.log(dbObj.host + '-' + dbObj.database);
 //  var conString = "postgres://"+dbObj.user+":"+dbObj.pasword+"@"+dbObj.host+":5432/"+dbObj.database
 //}
 //console.log('---------------');
} 

