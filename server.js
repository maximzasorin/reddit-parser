
/*
	Dependencies.
*/
var express = require('express');
var mongodb = require('mongodb');
var jade = require('jade');

/*
	App
*/
var app = express();
var port = 3000;

var mongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/reddit-parser';

var Parser = require('./parser');
var Formatter = require('./formatter');

//
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// middleware for default
app.use(function(req, res, next)  {
	var query = req.query;
	
	query.format = query.format || 'csv';

	if (query.columns) {
		query.columns = query.columns.replace(/\s/g, '');
		query.columns = query.columns.split(',');
	}	

	next();
});

// main part
mongoClient.connect(mongoUrl, function (err, db) {
  	if (err) {
    	console.log('Unable to connect to the mongoDB server. Error:', err.message);
  	} else {
	    console.log('Connection established to', mongoUrl);

		app.get('/', function(req, res) {
			res.render('index');
		});

		// reddit articles
		app.get('/api/v1/reddit/:r', function(req, res) {
			var redditName = req.params.r;
			var query = req.query;

			var parser = new Parser(db, redditName);

			parser.getPlainArticles(query.sort, query.order, function(err, result) {
				if (err) {
					res.send('error', err.message);
				} else {
					var formatter = new Formatter(result);

					if (query.format == 'sql') {
						res.send(formatter.formatToSql(query.table, query.columns));
					} else {
						res.send(formatter.formatToCsv(query.delimiter));
					}
				}
			});
		});

		// reddit articles top
		app.get('/api/v1/reddit/:r/top', function(req, res) {
			var redditName = req.params.r;
			var query = req.query;

			var parser = new Parser(db, redditName);

			parser.getTopArticles(query.sort, query.order, function(err, result) {
				if (err) {
					res.send('error', err);
				} else {
					var formatter = new Formatter(result);

					if (query.format == 'sql') {
						res.send(formatter.formatToSql(query.table, query.columns));
					} else {
						res.send(formatter.formatToCsv(query.delimiter));
					}
				}
			});
		});

		app.listen(port);
		console.log('Server started at ' + port + ' port');
  	}
});


