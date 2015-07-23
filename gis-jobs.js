var yaml = require('yamljs');
var pg = require('pg');
var program = require('commander');
pg.defaults.poolsize = 10;


//args
program
    .version('0.0.1')
    .usage('[options] ')
    .option('-d, --databaseconn <file>', 'PostGres database connection file <file> default is config/db.yml', String, 'config/db.yml')
    .option('-m, --maintenance <file>', 'maintenance configuration file <file>', String)
    .option('-t, --datatest <file>', 'data test configuration file <file>', String)
    .parse(process.argv);

/**
  Load yaml file for database connection using YAML.load
  do not change the name of database connection file db.yml
  or it will be pushed to gitHub :-(
**/
var dataBaseConnectionObject = yaml.load(program.databaseconn);

//sleep function
//short rest to allow for sql insert to complete
//found that this actuall increases the speed of inserts
var sleep = function (milliSeconds) {
    'use strict';
    var startTime = new Date().getTime(); // get the current time

    //Loop till time change in millisecons matches what was passed in
    while (new Date().getTime() < startTime + milliSeconds) {
    }
};

//gets duration based on start and end time milliseconds
var msToTime = function (duration) {
    'use strict';
    var milliseconds = duration,
        seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
};

var on_queryMessages = function (current, rowcount, arr, secarr) {
    'use strict';

    //first pass starting
    if (rowcount === 0) {
        console.log(' ');
        console.log('    Starting: ' + arr[rowcount]);
    }

    //called when completed;
    console.log('    Completed: ' + current.name);

    if (typeof secarr !== "undefined") {
        console.log('    ' + secarr[rowcount]);
    }
    console.log(' ');

    rowcount = rowcount + 1;
    var percentComplete = ((rowcount / arr.length ) * 100).toFixed(2);
    console.log('    Percent Completed: %' + percentComplete);
    //if not last call add starting of next one
    if (rowcount > 0 && rowcount < arr.length) {
        console.log('    Starting: ' + arr[rowcount]);
    }

    return rowcount;

};

/**
_____        _          _______        _
|  __ \      | |        |__   __|      | |
| |  | | __ _| |_ __ _     | | ___  ___| |_ ___
| |  | |/ _` | __/ _` |    | |/ _ \/ __| __/ __|
| |__| | (_| | || (_| |    | |  __/\__ \ |_\__ \
|_____/ \__,_|\__\__,_|    |_|\___||___/\__|___/
  data tests passed as argument?
  if so run the data testests
  the argiument must be a yaml file
**/
if (program.datatest) {
    var startTime = new Date().getTime();
    var endTime;

    //objects
    var dataTests_YAML = yaml.load(program.datatest);
    var dataTests_Obj = dataTests_YAML.tests;

    //clients for data data tests
    var dataTests_client;
    var dataTestsSuccess_client;

    //date tests varriables
    var dataTests_queryConfig;
    var dataTests_check = true;
    var dataTests_checkRun = false;
    var dataTests_array = [];
    var dataTests_resultsArray = [];
    var dataTests_rowcount = 0;


    //varrables for dataTestsSuccess
    var dataTestsSuccess_queryConfig;
    var dataTestsSucesss_array = [];
    var dataTestsSuccess_rowcount = 0;

    //generic error callback for client,queries
    var dataTests_connectionError = function (err) {
        'use strict';
        if (err) {
            console.error("Connection Error: %s", err);
            dataTests_resultsArray.push('FAILED');
            dataTests_check = false;
        }
        return err;
    };

    //data test drain callback when all maintenace queries finish
    var dataTests_clientDrain = function () {
        'use strict';
        dataTests_client.end();
    };

    //generic error callback for client,queries
    var dataTests_clientError = function (err) {
        'use strict';
        if (err) {
            console.error("Client Error: %s", err);
            dataTests_resultsArray.push('FAILED');
            dataTests_check = false;
        }
        return err;
    };

    //when client ends
    var dataTests_clientEnd = function (result) {
        'use strict';
        console.log('Tests Complete.');

        //all tests completed and one of them failed
        if (!dataTests_check) {

            //something failed
            console.log('FAILED test(s) for: ' + dataTests_YAML.testname + '.');
            console.log('Failed a test! Please see the log for details');

            //time
            endTime = new Date().getTime();
            var aTime = endTime - startTime;
            var  timeMessage = msToTime(aTime);
            console.log('completed in ' + timeMessage);
            console.log(' ');
        }

        //all tests completed and succesfull
        if (dataTests_check && !dataTests_checkRun) {
            console.log('PASSED all tests for: ' + dataTests_YAML.testname + '.');
            dataTestsSuccess();
        }

        return result;
    };


    //generic error callback for client,queries
    var dataTests_queryError = function (err) {
        'use strict';
        if (err) {
            console.error("Query Error: %s", err);
            dataTests_resultsArray.push('FAILED');
            dataTests_check = false;
        } else {

        }
        return err;
    };

    /**
      query on row method.
      for data tests when a row exists named check
      we use that to determine a pass or fail.
      when we encounter any fail we change the Tests state to fail with
      dataTests_check.
    **/
    var dataTests_queryRow = function (row, result) {
        'use strict';
        if (row.hasOwnProperty('check')) {
            if (row.check) {
                dataTests_resultsArray.push('PASSED');
            } else {
                dataTests_resultsArray.push('FAILED');
                dataTests_check = false;
            }
        } else {
            dataTests_resultsArray.push('FAILED');
            dataTests_check = false;
        }
    };

    //when query ends
    var dataTests_queryEnd = function (result) {
        'use strict';
        if (result.rowCount === 0) {
          dataTests_resultsArray.push('FAILED');
          dataTests_check = false;
        }
        dataTests_rowcount = on_queryMessages(this, dataTests_rowcount, dataTests_array, dataTests_resultsArray);
    };


    //data tests functionå
    var dataTests = function () {
        'use strict';
        var id;

        //open client and connection for Buidling Buffers
        dataTests_client = new pg.Client(dataBaseConnectionObject)
            .on('drain', dataTests_clientDrain)
            .on('error', dataTests_clientError)
            .on('end', dataTests_clientEnd);

        //connect
        dataTests_client.connect(dataTests_connectionError);

        console.log(' ');
        console.log('Running Test(s) for  ' + dataTests_YAML.testname);

        for (id in dataTests_Obj) {
            if (dataTests_Obj.hasOwnProperty(id)) {

                dataTests_queryConfig = dataTests_Obj[id];

                dataTests_array.push(dataTests_queryConfig.name);

                dataTests_client.query(dataTests_queryConfig)
                    .on('error', dataTests_queryError)
                    .on('row', dataTests_queryRow)
                    .on('end', dataTests_queryEnd);
            }
        }
    };

    //data test sucessfull drain callback when all maintenace queries finish
    var dataTestsSuccess_clientDrain = function () {
        'use strict';
        dataTestsSuccess_client.end();
    };

    //generic error callback for client,queries
    var dataTestsSuccess_clientError = function (err) {
        'use strict';
        if (err) {
            console.error("Client Error: %s", err);
        }
        return err;
    };

    //generic error callback for client,queries
    var dataTestsSuccess_connectionError = function (err) {
        'use strict';
        if (err) {
            console.error("Connection Error: %s", err);
        }
        return err;
    };

    //when client ends
    var dataTestsSuccess_clientEnd = function (result) {
        'use strict';

        endTime = new Date().getTime();

        var aTime = endTime - startTime;
        var  timeMessage = msToTime(aTime);
        console.log('completed Data Test in ' + timeMessage);
        console.log(' ');

        return result;
    };

    //data tests successful query row callback
    var dataTestsSuccess_queryRow = function (row, result) {
        'use strict';
        return row;
    };

    //generic error callback for client,queries
    var dataTestsSuccess_queryError = function (err) {
        'use strict';
        if (err) {
            console.error("Query Error: %s", err);
        }
        return err;
    };

    //when query ends
    var dataTestsSuccess_queryEnd = function (result) {
        'use strict';
        dataTestsSuccess_rowcount = on_queryMessages(this, dataTestsSuccess_rowcount, dataTestsSucesss_array);
    };

    //data tests success full run these queries
    var dataTestsSuccess = function () {
        'use strict';
        var id;
        var dataTests_successCommands = dataTests_YAML.onsuccess;

        console.log('');
        console.log('Running Data Push for ' + dataTests_YAML.testname);

        //open client and connection for Buidling Buffers
        dataTestsSuccess_client = new pg.Client(dataBaseConnectionObject)
            .on('drain', dataTestsSuccess_clientDrain)
            .on('error', dataTestsSuccess_clientError)
            .on('end', dataTestsSuccess_clientEnd);

        //connect
        dataTestsSuccess_client.connect(dataTestsSuccess_connectionError);


        for (id in dataTests_successCommands) {
            if (dataTests_successCommands.hasOwnProperty(id)) {
                dataTests_checkRun = true;

                dataTestsSuccess_queryConfig = dataTests_successCommands[id];

                dataTestsSucesss_array.push(dataTestsSuccess_queryConfig.name);

                dataTestsSuccess_client.query(dataTestsSuccess_queryConfig)
                    .on('error', dataTestsSuccess_queryError)
                    .on('row', dataTestsSuccess_queryRow)
                    .on('end', dataTestsSuccess_queryEnd);
            }
        }
    };

    //run data tests
    dataTests();
}

//maintenance passed as argument?
/*
__  __       _       _
|  \/  |     (_)     | |
| \  / | __ _ _ _ __ | |_ ___ _ __   __ _ _ __   ___ ___
| |\/| |/ _` | | '_ \| __/ _ \ '_ \ / _` | '_ \ / __/ _ \
| |  | | (_| | | | | | ||  __/ | | | (_| | | | | (_|  __/
|_|  |_|\__,_|_|_| |_|\__\___|_| |_|\__,_|_| |_|\___\___|
*/
if (program.maintenance) {
    var startTime = new Date().getTime();
    var endTime;

    //load maintenance yaml
    var maintenance_YAML = yaml.load(program.maintenance);

    //clients for data maintenace
    var maintenance_client;

    //objects
    var maintenance_Obj = maintenance_YAML.sql;
    var maintenance_queryConfig;

    //varrables for maintenance_queryEnd
    var maintenance_rowcount = 0;
    var maintenance_array = [];

    //maintence error callback
    var maintenance_connectionError = function (err) {
        'use strict';
        if (err) {
            console.error("Connection Error: %s", err);
        }
        return err;
    };

    //maintence drain callback when all maintenace queries finish
    var maintenance_clientDrain = function () {
        'use strict';
        maintenance_client.end();
    };

    //maintence error callback
    var maintenance_clientError = function (err) {
        'use strict';
        if (err) {
            console.error("Client Error: %s", err);
        }
        return err;
    };

    //when client ends
    var maintenance_clientEnd = function (result) {
        'use strict';
        endTime = new Date().getTime();

        var aTime = endTime - startTime;
        var  timeMessage = msToTime(aTime);
        console.log('Completed Maintenance in ' + timeMessage + '.');
        console.log(' ');

        return result;
    };

    //maintence error callback
    var maintenance_queryError = function (err) {
        'use strict';
        if (err) {
            console.error("Query Error: %s", err);
        }
        return err;
    };


    //maintenance query row callback
    var maintenance_queryRow = function (row, result) {
        'use strict';
        return row;
    };


    /**
      query end callback for maintenance
      provides feedback about progress and status of build
    **/
    var maintenance_queryEnd = function (result) {
        'use strict';

        maintenance_rowcount = on_queryMessages(this, maintenance_rowcount, maintenance_array);

    };

    /*
      main function for runnong sql based maintenace
    */
    var maintenance = function () {
        'use strict';
        var id;

        console.log(' ');
        console.log('Starting the Running of Maintenance job.');

        //open client and connection for Buidling Buffers
        maintenance_client = new pg.Client(dataBaseConnectionObject)
            .on('drain', maintenance_clientDrain)
            .on('error', maintenance_clientError)
            .on('end', maintenance_clientEnd);

        //connect
        maintenance_client.connect(maintenance_connectionError);

        for (id in maintenance_Obj) {
            if (maintenance_Obj.hasOwnProperty(id)) {

                maintenance_queryConfig = maintenance_Obj[id];

                maintenance_array.push(maintenance_queryConfig.name);

                maintenance_client.query(maintenance_queryConfig)
                    .on('error', maintenance_queryError)
                    .on('row', maintenance_queryRow)
                    .on('end', maintenance_queryEnd);
            }
        }
    };

    //run  maintenance();
    maintenance();

}



pg.end();
