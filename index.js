var Q = require("q");

var sql = require("./src/sql.js");
var psql = require("./src/psql.js");
var cypher = require("./src/cypher.js");
var hybrid = require("./src/hybrid.js");

var testBlocks = require("./src/tests.js");

main();

function main() {

	// initialise all systems
	var p = Q.all([
		sql.init(),
		cypher.init(),
		hybrid.init("block"),
		psql.init()
	]);

	// run all test blocks sequentially 
	testBlocks.forEach(function(t) {
		p = p.then(function() {
			var iterations = 3;
			var context = {
				sql: sql,	
				cypher: cypher,
				hybrid: hybrid,
				psql: psql
			};
			return block(t.name, t.tests, iterations, context);
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

function test(fun, iter, ctx) {
	var p = Q(true);
	var start = process.hrtime();
	
	for (var i=0; i<iter; i++) {
		// discard the previous result of running the function, and re-pass the context instead
		p = p.then(function() {return ctx;});
		p = p.then(fun)
	}

	return p.then(function(result) {
		// called after the last iteration
		return [process.hrtime(start), iter, result];
	});
}

function block(name, funcs, iter, ctx) {

	var results = [];
	var promise = Q(true);
	funcs.forEach(function (f) {
	    promise = promise.then(function() {
	    	var r = test(f, iter, ctx);
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