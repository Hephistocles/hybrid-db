var mysql = require('promise-mysql');
var rp = require("request-promise");

main();


function init() {
	return mysql.createConnection({
		host: 'localhost',
		user: 'hybrid',
		database: 'hybrid'
	})
	.then(function(conn) {
		sql.conn = conn;
	});
}


function main() {
	init()
		.then(function() {

			return [
				sql('select * from points limit 1'),
				cypher("MATCH (n1)-[r]->(n2) RETURN n1, r, n2 LIMIT 2", {})
			]
		})
		.spread(function(sqlRes, neoRes) {
			console.log(sqlRes);
			console.log(neoRes);
		})
		.then(function() {
			sql.conn.end();
		})
}

// CONNECTION IMPLEMENTATIONS

// MYSQL
function sql(query, params) {
	return sql.conn.query(query)
		.then(function(result) {
			// any default processing?
			return result;
		});
}


// NEO4J
function cypher(query, params) {
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
}