var yaml = require('yamljs');
var pg = require('pg');

// Load yaml file using YAML.load
var nativeObject = yaml.load('config/config.yml');
var obj = nativeObject.databases;
var prop;
var aQuerys;
var aSQLFiles;
var client;
var aQuery;
var query;
var aSQLFile;
var envPG = {};

for (prop in obj) {
    aQuerys = obj[prop].preparedStatments;
    aSQLFiles = obj[prop].sqlFiles;

    client = new pg.Client(obj[prop]);
    client.on('drain', client.end.bind(client));
    client.connect(function (err) {
        'use strict';
        if (err) {
            // this should print "error: AND ERROR MESSAGE FROM POSTGRES"
            console.error("%s", err);
        }
    });
    for (aQuery in aQuerys) {
        query = client.query(aQuerys[aQuery], function (err) {
            'use strict';
            if (err) {
                // this should print "error: AND ERROR MESSAGE FROM POSTGRES"
                console.error("%s", err);
            }
        });

        query.on('end', function (result) {
            //fired once and only once, after the last row has been returned and after all 'row' events are emitted
            //in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
            'use strict';
            console.log(result.rowCount + ' rows were received');
        });
    }

    pg.end();

    for (aSQLFile in aSQLFiles) {
        console.log(aSQLFiles[aSQLFile]);

        envPG['PGPASSWORD'] = obj[prop].password;

        var spawn = require('child_process').spawn,
            sql    = spawn('/usr/pgsql-9.2/bin/psql', ['-U' + obj[prop].user, '-h' + obj[prop].host, '-d' + obj[prop].database, '-f' + aSQLFiles[aSQLFile].file], {env: envPG});

        sql.stdout.on('data', function (data) {
            'use strict';
            console.log('stdout: ' + data);
        });

        sql.stderr.on('data', function (data) {
            'use strict';
            console.log('stderr: ' + data);
        });

        sql.on('close', function (code) {
            'use strict';
            console.log('child process exited with code ' + code);
        });

    }

}

// Load yaml file using YAML.load
nativeObject = yaml.load('config/config.yml');

obj = nativeObject.databases;
for (prop in obj) {
    aQuerys = obj[prop].preparedStatments;
    aSQLFiles = obj[prop].sqlFiles;
    client = new pg.Client(obj[prop]);
    client.on('drain', client.end.bind(client));
    client.connect(function (err) {
        'use strict';
        if (err) {
            // this should print "error: AND ERROR MESSAGE FROM POSTGRES"
            console.error("%s", err);
        }
    });

    for (aQuery in aQuerys) {
        query = client.query(aQuerys[aQuery], function (err) {
            'use strict';
            if (err) {
                // this should print "error: AND ERROR MESSAGE FROM POSTGRES"
                console.error("%s", err);
            }
        });

        query.on('end', function (result) {
            //fired once and only once, after the last row has been returned and after all 'row' events are emitted
            //in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
            'use strict';
            console.log(result.rowCount + ' rows were received');
        });
    }

    pg.end();

    for (aSQLFile in aSQLFiles) {
        console.log(aSQLFiles[aSQLFile]);
        envPG = {};
        envPG['PGPASSWORD'] = obj[prop].password;
        var spawn = require('child_process').spawn,
            sql    = spawn('/usr/pgsql-9.2/bin/psql', ['-U' + obj[prop].user, '-h' + obj[prop].host, '-d' + obj[prop].database, '-f' + aSQLFiles[aSQLFile].file], {env: envPG});

        sql.stdout.on('data', function (data) {
            'use strict';
            console.log('stdout: ' + data);
        });

        sql.stderr.on('data', function (data) {
            'use strict';
            console.log('stderr: ' + data);
        });

        sql.on('close', function (code) {
            'use strict';
            console.log('child process exited with code ' + code);
        });
    }
}
