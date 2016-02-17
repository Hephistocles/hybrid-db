var q = require("q");

var sql = require("./src/sql.js");
var cypher = require("./src/cypher.js");
var hybrid = require("./src/hybrid.js");

main();

function main() {
	q.all([
		sql.init(),
		cypher.init(),
		hybrid.init("block")
		])
		.then(function() {
			return [
				sql.query('select * from points limit 1', {}),
				cypher.query("MATCH (n1)-[r]->(n2) RETURN n1, r, n2 LIMIT 2", {}),
				hybrid.query("", {id:1})
			]
		})
		.spread(function(sqlRes, neoRes, hybridRes) {
			// TODO: time results
			console.log(hybridRes);
			return hybrid.query("", {id:1363})
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