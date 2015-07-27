// libs
var _ = require('underscore');


/*
	Formatter


*/
var Formatter = function(data) {
	this.data = data.slice();
}


/*
	Make sql insert header

*/
Formatter.prototype.sqlInsertHead = function(count, tableName, fieldNames) {
	// process
	var outputText = 'insert into ' + tableName;
	if (fieldNames) {
		outputText += '(';
		for (var i = 0; i < count; i++) {
			if (fieldNames[i]) {
				outputText += fieldNames[i];
			} else {
				outputText += 'Foo' + i;
			}
			outputText +=  (i < count - 1)?', ':'';
		}
		outputText += ')';
	}

	return outputText;
};


/*
	Format array of object to CSV


*/
Formatter.prototype.formatToCsv = function(delimiter) {
	var formatter = this;

	// defaults
	delimiter = delimiter || ', ';

	// process
	var outputText = '';
	_.each(this.data, function(element) {
		var i = 1;
		for (field in element) {
			outputText += element[field] + (i < _.size(element)?delimiter:'');
			i++;
		}
		outputText += '\n';
	});

	return outputText;
};


/*
	Format array of objects to SQL

	
*/
Formatter.prototype.formatToSql = function(tableName, fieldNames) {
	var formatter = this;

	// defaults
	tableName = tableName || 'articles';

	var count = _.size(this.data[0]);	

	var outputText = '';
	_.each(this.data, function(element) {
		outputText += formatter.sqlInsertHead(count, tableName, fieldNames);

		outputText += ' values(';
		var i = 1;
		for (field in element) {
			outputText += '"' + element[field] + '"' + (i < _.size(element)?', ':'');
			i++;
		}
		outputText += ');\n';
	});

	return outputText;
};

module.exports = Formatter;


