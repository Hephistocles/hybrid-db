// for now we'll just have a singleton connection instance
var Q = require("q");
var mysql = require('promise-mysql');

var connection;

module.exports = 
	{
		init: function(){
			if (connection === null || connection === undefined) {
				return mysql.createConnection({
						host: 'localhost',
						user: 'hybrid',
						database: 'hybrid'
					})
					.then(function(conn) {
						connection = conn;
					});
			} else return Q.reject("SQL Initialisation failed");
		},
		query: function(query, params){

			return connection.query(query)
				.then(function(result) {
					// any default processing?
					return result;
				});
		},
		end: function() {
			connection.end();
			connection = null;
			return Q(true);
		}
	};