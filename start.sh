#!/bin/bash

#Invoke the Forever module (to START our Node.js server).
NODE_ENV=production \
forever \
start \
-al forever.log \
-ao log/out.log \
-ae log/err.log \
~/www/pdfstitcher/app.js