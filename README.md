# King of rebases backend

## Requirements
* node v14
* heroku (scheduler & postgress DB)

## About

Simple express application designed to run on Heroku free tier. `index.js` is the core express application which responds to requests; it just pulls out the latest row from the database. `update-data.js` is a scheduled job which performs JSON RPC calls to the respective chains, pulls out the latest index, makes a call to coingecko for prices and then perform appropriate calculations on the token amount and network figures for each project. This is then inserted into the database, ready for the express application to pull out.

The architecture isn't the most efficient but was designed to run on the Heroku free tier, and as such some database denormalisation and bundling took place. 
