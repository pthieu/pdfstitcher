#!/bin/bash

#Invoke the Forever module (to START our Node.js server).
NODE_ENV=production \
forever \
start \
app.js