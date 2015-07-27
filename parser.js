// libs
var _ = require('underscore');
var http = require('http');


/*
	Parser


*/
var Parser = function(db, redditName, fields) {
	this.db = db;
	this.redditName = redditName;
	this.fields = fields || ['id', 'title', 'created_utc', 'score', 'domain'];
};


/*
	Select fields from raw JSON

*/
Parser.prototype.selectFields = function(jsonArticles) {
	var parser = this;
	var rawArticles = jsonArticles.data.children;
	var articles = [];
	
	_.each(rawArticles, function(rawArticle) {
		var articleData = rawArticle.data;
		var article = {};

		_.each(parser.fields, function(field) {
			article[field] = articleData[field];
		});
		article.reddit_name = parser.redditName;
		articles.push(article);
	});

	return articles;
};


/*
	Remove excluded fields

*/
Parser.prototype.exclude = function(articles, fields) {
	_.each(articles, function(element) {
		for (field in element) {
			if (_.indexOf(fields, field) != -1) {
				delete element[field];
			}
		}
	});
};


/*
	Get JSON from site

*/
Parser.prototype.parseReddit = function(callback) {
	var options = {
		host: 'www.reddit.com',
		port: 80,
		path: '/r/' + this.redditName + '.json',
		method: 'GET'
	};

	http.get(options, function(res) {
		var content = '';
        
        res.on('data', function(d) {
            content += d;
        });

        res.on('end', function() {
        	callback(null, JSON.parse(content));
		});
	});
};


/*
	Return last reddit update

*/
Parser.prototype.getLastParsing = function(callback) {
	var redditName = this.redditName;
	this.db.collection('reddits', function(err, collection) {
		if (err) {
			callback(err);
		} else {
			collection.findOne({ 'name' : redditName}, function(err, item) {
				if (err) {
					callback(err);
				} else {
					callback(null, item?item.lastParsing:null);
				}
			});
		}
	});
}


/*
	Insert or update reddit’s last parsing time

*/
Parser.prototype.updateLastParsing = function(time, callback) {
	var redditName = this.redditName;

	this.db.collection('reddits', function(err, collection) {
		if (err) {
			callback(err);
		} else {
			collection.findOne({ 'name' : redditName}, function(err, item) {
				if (err) {
					callback(err);
				} else {
					if (!item) {
						collection.insert(
							{
								'name' : redditName,
								'lastParsing' : time
							}
							, function(err, result) {
								if (err) {
									callback(err);
								} else {
									console.log('insert last parsing time');
									callback(null, result[0].lastParsing);
								}
							}
						);
					} else {
						collection.update(
							{ 'name' : redditName }
							, { 
								'name' : redditName,
								'lastParsing' : time
							}
							, function(err) {
								if (err) {
									callback(err);
								} else {
									console.log('update last parsing time');
									callback(null, time);
								}
							}
						);
					}
				}
			});
		}
	});
}


/*
	Insert articles to database

*/
Parser.prototype.insertArticles = function(callback) {
	var parser = this;

	parser.parseReddit(function(err, jsonArticles) {
		if (err) {
			callback(err);
		} else {
			var clearedArticles = parser.selectFields(jsonArticles);

			parser.db.collection('articles', function(err, collection) {
				if (err) {
					callback(err);
				} else {
					collection.insert(clearedArticles, function(err, result) {
						if (err) {
				   			callback(err);
				   		} else {
				   			callback(null, result);
				   		}
				    });
				}
			});
		}
	});
};


/*
	Update articles in database if it’s necessary


*/
Parser.prototype.updateArticles = function(callback) {
	var parser = this;

	parser.getLastParsing(function(err, lastParsing) {	
		if (!lastParsing || Date.now() - lastParsing > 1 * 60 * 1000) {
			parser.db.collection('articles', function(err, collection) {
				if (err) {
					callback(err);
				} else {
					collection.remove({'reddit_name' : parser.redditName}, function(err, count) {
						if (err) {
							callback(err);
						} else {
							parser.insertArticles(function(err, result) {
								if (err) {
									callback(err);
								} else {
									parser.updateLastParsing(
										Date.now()
										, function(err, lastParsing) {
											console.log(parser.redditName, 'update', lastParsing);
											callback(err);
										}
									);
								}
							});
						}
					});
				}
			});
		} else {
			console.log(parser.redditName, 'not update', lastParsing);
			callback(null);
		}
	});
};


/*
	Get articles for reddit

*/
Parser.prototype.getPlainArticles = function(sort, order, callback) {
	var parser = this;
	
	// defaults
	sort = sort || 'title';
	order = order || 'asc';

	//
	parser.updateArticles(function(err) {
		if (err) {
			callback(err);
		} else {
			var sortHash = {};
			sortHash[sort] = (order == 'asc')?1:-1;

			parser.db.collection('articles', function(err, collection) {
				collection.find({'reddit_name': parser.redditName})
					.sort(sortHash)
					.toArray(
						function(err, articles) {
							if (err) {
								callback(err);
							} else {
								parser.exclude(articles, ['_id', 'domain', 'reddit_name']);
								callback(null, articles);
							}
						}
					);
			});
		}
	});
};


/*
	Get top articles for reddit

*/
Parser.prototype.getTopArticles = function(sort, order, callback) {
	var parser = this;

	// defaults
	sort = sort || 'score';
	order = order || 'desc';

	parser.updateArticles(function(err) {
		if (err) {
			callback(err);
		} else {
			parser.db.collection('articles', function(err, collection) {
				if (err) {
					callback(err);
				} else {
					var sortHash = {};
					sortHash[sort] = (order == 'asc')?1:-1;

					collection.aggregate(
						[
							{ $match: {'reddit_name': parser.redditName}}
							, { $group: {
									'_id': '$domain',
									'count_articles': {$sum: 1},
									'score_sum': {$sum: '$score'}
								}
							}
							, { $project: {
									'_id': 0,
									'domain': '$_id',
									'count': '$count_articles',
									'score': '$score_sum'
								}
							}
							, { $sort: sortHash}
						]
						, function(err, articles) {
							if (err) {
								callback(err);
							} else {
								parser.exclude(articles, ['reddit_name']);
								callback(null, articles);
							}
						}
					);
				}
			});
		}
	});
};

module.exports = Parser;


