// for now we'll just have a singleton connection instance
var Q = require("q");
var pgp = require('pg-promise')();
var config = require("../config.json");

var connection;

module.exports = 
	{
		init: function(){
			connection = pgp(config.auth.psql);
			return Q(connection);
		},
		query: function(query, params){
			// console.log("Quering");
			return connection.query(query, params)
				.then(function(result) {
					// any default processing?
					return result;
				});
		},
		end: function() {
			pgp.end();
			return Q(true);
		}
	};