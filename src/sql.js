// for now we'll just have a singleton connection instance
var Q = require("q");
var mysql = require('promise-mysql');
var config = require("../config.json");

var connection;

module.exports = 
	{
		init: function(){
			if (connection === null || connection === undefined) {
				return mysql.createConnection({
						host: config.auth.sql.host,
						user: config.auth.sql.user,
						password: config.auth.sql.password,
						database: config.auth.sql.database
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