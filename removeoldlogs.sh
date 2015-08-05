#!/bin/bash


date=`date +%d-%b-%Y`


#remove files over a week old.
find /home/sde/psql-jobs/log/*.log  -mtime +7  -exec rm {} \;

