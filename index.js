var q = require("q");

var sql = require("./src/sql.js");
var cypher = require("./src/cypher.js");
var hybrid = require("./src/hybrid.js");

main();

function main() {
	q.all([
		sql.init(),
		cypher.init(),
		hybrid.init()
		])
		.then(function() {
			console.log("Done init");
			// TODO: choose decent queries
			return [
				sql.query('select * from points limit 1', {}),
				cypher.query("MATCH (n1)-[r]->(n2) RETURN n1, r, n2 LIMIT 2", {}),
				hybrid.query("", {})
			]
		})
		.spread(function(sqlRes, neoRes, hybridRes) {
			// TODO: time results
			console.log(sqlRes);
			console.log(neoRes);
			console.log(hybridRes);
		})
		.then(function() {
			return [
				sql.end(),
				cypher.end(),
				hybrid.end()
			];
		})
		.catch(function(err) {
			console.error(err);
			throw err;
		})
}