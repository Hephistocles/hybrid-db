var Q = require("q");

var sql = require("./src/sql.js");
var psql = require("./src/psql.js");
var cypher = require("./src/cypher.js");
var hybrid = require("./src/hybrid.js");


main();

function main() {

	// initialise all systems
	var p = Q.all([
		sql.init(),
		cypher.init(),
		hybrid.init("block"),
		psql.init()
	]);

	var testBlocks = [
		{
			name: "Samples",
			tests: [
				function() {
					return sql.query('select * from points limit 1', {});
				},
				function() {
					return cypher.query("MATCH (n1 {id:1})-[r]->(n2) RETURN n2 LIMIT 2", {});
				},
				function() {
					return hybrid.query("", {id:1})
				},
				function() {
					return psql.query('select astarroute(1, 1355)', {});
				}
			]
		}
	];

	// run all test blocks sequentially 
	testBlocks.forEach(function(t) {
		p = p.then(function() {
			var iterations = 3;
			return block(t.name, t.tests, iterations);
		})
		.spread(function(sqlRes, neoRes, hybridRes, psqlRes) {
			console.log("\n\n+-----------+");
			console.log("| ALL DONE  |");
			console.log("+-----------+\n");
			report("sql", sqlRes);
			report("neo", neoRes);
			report("hybrid", hybridRes);
			report("psql", psqlRes);

		});
	});

	p.then(function() {
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

function test(fun, iter) {
	var p = Q(true);
	var start = process.hrtime();
	
	for (var i=0; i<iter; i++) {
		p = p.then(fun);
	}

	return p.then(function(result) {
		// called after the last iteration
		return [process.hrtime(start), iter, result];
	});
}

function block(name, funcs, iter) {

	var results = [];
	var promise = Q(true);
	funcs.forEach(function (f) {
	    promise = promise.then(function() {
	    	var r = test(f, iter);
	    	results.push(r);
	    	return r;
	    });
	});

	return promise.then(function() {
		return results;
	});
}

function report(name, result) {
	console.log(name + ": " + result[0][0] + "." + pad(result[0][1],9) + "s for " + result[1] + " rounds. Last result looked like: ");
	console.log(result[2]);
	console.log(" ");
}

function pad(num, size){ 
	return ('000000000' + num).substr(-size);
}