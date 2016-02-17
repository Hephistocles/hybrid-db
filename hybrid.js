var Q = require("q");
var mysql = require('promise-mysql');
var Graph = require("./classes.js").Graph;
var config = require("../config.json");

// for now we'll just have a singleton connection/graph instance
var connection;
var graph;


module.exports = 
	{
		init: function(){

			// initialise our in-memory store as an empty graph
			graph = new Graph([], []);

			// initialise a connection to the underlying DB
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
			} else return Q.reject("Hybrid SQL Initialisation failed");
		},
		query: function(query, params){
			return Q(true);
		},
		end: function() {return Q(true);}
	};