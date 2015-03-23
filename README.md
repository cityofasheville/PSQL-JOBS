# Node Based PSQL-JOBS

Run PostGreSQL jobs as simple [Parameterized Queries](#parameterized-queries) or from [SQL files](#sql-files).

##Install

```sh
$ git clone https://github.com/cityofasheville/PSQL-JOBS.git
$ cd PSQL-JOBS 
$ npm install 
$ cp config_sample.yml config/config.yml
```

edit `config/config.yml`
update with your settings.

example:

```yaml
databases:
- host: 192.168.0.1
  database: database
  user: postgres
  password: postgres
  preparedStatments:
  - name: reindex database
    text: REINDEX DATATABASE database;
    values:
  - name: VACUUM schema.table;
    text: VACUUM ANALYZE schema.table;
    values:
  - name: INSERT data
    test: INSERT INTO  schema.table values($1,$1)
    values: [1,'test']
  sqlFiles:
  - name: test1
    file: sql/sqlfile1.sql
  - name: test2
    file: sql/sqlfile2.sql
````

### Run

```sh
$ node app.js
```

##Parameterized Queries

##SQL files


##License

The MIT License (MIT)

Copyright (c) 2015 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


