var Q = require("q");

var sql = require("./src/sql.js");
var psql = require("./src/psql.js");
var cypher = require("./src/cypher.js");
var hybrid = require("./src/hybrid.js");

var iter = 1;

main();

function main() {
	Q.all([
		sql.init(),
		cypher.init(),
		hybrid.init("block"),
		psql.init()
		])
		.then(function() {
			var p = Q(true);
			for (var i=0; i<iter; i++) {
				p = p.then(function() {
					return sql.query('select * from points limit 1', {});
				});
			}
			var start = process.hrtime();
			p = p.then(function(result) {
				return [process.hrtime(start), result];
			})
			return [p];
		})
		.spread(function(sqlRes) {

			var p = Q(true);
			for (var i=0; i<iter; i++) {
				p = p.then(function() {
					return cypher.query("MATCH (n1 {id:1})-[r]->(n2) RETURN n2 LIMIT 2", {});
				});
			}
			var start = process.hrtime();
			p = p.then(function(result) {
				return [process.hrtime(start), result];
			})
			return [sqlRes, p];
		})
		.spread(function(sqlRes, cypherRes) {

			var p = Q(true);
			for (var i=0; i<iter; i++) {
				p = p.then(function() {
					return hybrid.query("", {id:1})
				});
			}
			var start = process.hrtime();
			p = p.then(function(result) {
				return [process.hrtime(start), result];
			})
			return [sqlRes, cypherRes, p];
		})
		.spread(function(sqlRes, cypherRes, hybridRes) {

			var p = Q(true);
			for (var i=0; i<iter; i++) {
				p = p.then(function() {
					return psql.query('select astarroute2(1, 1355)', {});
				});
			}
			var start = process.hrtime();
			p = p.then(function(result) {
				return [process.hrtime(start), result];
			})
			return [sqlRes, cypherRes, hybridRes, p];
		})
		.spread(function(sqlRes, neoRes, hybridRes, psqlRes) {
			report("sql", sqlRes);
			report("neo", neoRes);
			report("hybrid", hybridRes);
			report("psql", psqlRes);

		})
		.then(function() {
			return [
				sql.end(),
				cypher.end(),
				hybrid.end(),
				psql.end()
			];
		})
		.catch(function(err) {
			console.error(err);
			throw err;
		})
}

function subtime(time1, time2) {
	var t = [time1[0] - time2[0],time1[1] - time2[1]];
	if (t[1]<0) {
		t[0]--;
		t[1] = 1+t[0];
	}
}

function report(name, result) {
	console.log(name + ": " + result[0][0] + "." + pad(result[0][1],9) + "ns for " + iter + " rounds. Last result looked like: ");
	console.log(result[1]);
	console.log(" ");
}

function pad(num, size){ 
	return ('000000000' + num).substr(-size);
}