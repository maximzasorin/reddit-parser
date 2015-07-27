// libs
var express = require('express');
var mongodb = require('mongodb');

// app
var app = express();
var port = 3000;

var mongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/reddit-parser';

var Parser = require('./parser');
var Formatter = require('./formatter');

// middleware for default
app.use(function(req, res, next)  {
	var query = req.query;
	
	query.format = query.format || 'csv';

	if (query.fields) {
		query.fields = query.fields.replace(' ', '');
		query.fields = query.fields.split(',');
	}	

	next();
});

// main part
mongoClient.connect(mongoUrl, function (err, db) {
  	if (err) {
    	console.log('Unable to connect to the mongoDB server. Error:', err);
  	} else {
	    console.log('Connection established to', mongoUrl);

	    // routes
		app.get('/', function(req, res) {
			res.send('reddit-parser');
		});

		// reddit articles
		app.get('/reddit/:r', function(req, res) {
			var redditName = req.params.r;
			var query = req.query;

			var parser = new Parser(db, redditName);

			parser.getPlainArticles(query.sort, query.order, function(err, result) {
				if (err) {
					res.send('error', err);
				} else {
					var formatter = new Formatter(result);

					if (query.format == 'sql') {
						res.send(formatter.formatToSql(query.table, query.fields));
					} else {
						res.send(formatter.formatToCsv(query.delimiter));
					}
				}
			});
		});

		// reddit articles top
		app.get('/reddit/:r/top', function(req, res) {
			var redditName = req.params.r;
			var query = req.query;

			var parser = new Parser(db, redditName);

			parser.getTopArticles(query.sort, query.order, function(err, result) {
				if (err) {
					res.send('error', err);
				} else {
					var formatter = new Formatter(result);

					if (query.format == 'sql') {
						res.send(formatter.formatToSql(query.table, query.fields));
					} else {
						res.send(formatter.formatToCsv(query.delimiter));
					}
				}
			});
		});

		//

		app.listen(port);
		console.log('Server started at ' + port + ' port');

		//
  	}
});



