var Q = require("q");
var rp = require("request-promise");

module.exports = 
	{
		init: function(){return Q(true);},
		query: function(query, params){
			return rp.post({
					uri: "http://localhost:7474/db/data/transaction/commit",
					'auth': {
						'user': 'neo4j',
						'pass': 'LockDown1'
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