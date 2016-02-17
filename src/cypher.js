var Q = require("q");
var rp = require("request-promise");
var config = require("../config.json");

module.exports = 
	{
		init: function(){return Q(true);},
		query: function(query, params){
			return rp.post({
					uri: "http://localhost:7474/db/data/transaction/commit",
					'auth': {
						'user': config.auth.neo4j.user,
						'pass': config.auth.neo4j.password
					},
					json: {
						statements: [{
							statement: query,
							parameters: params
						}]
					}
				})
				.then(function(result) {
					// any default processing?
					return JSON.stringify(result.results[0]);
				});
		},
		end: function() {return Q(true);}
	};