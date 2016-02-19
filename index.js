var Q = require("q");

var sql = require("./src/sql.js");
var psql = require("./src/psql.js");
var cypher = require("./src/cypher.js");
var hybrid = require("./src/hybrid.js");

var testBlocks = require("./src/tests.json");

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
			var iterations = 1;
			return block(t.name, t.tests, iterations);
		})
		// output the results for each block as we go
		.spread(report);
	});

	// finally close up the engine connections
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

function block(name, tests, iter) {

	var results = [];
	var promise = Q(true);
	tests.forEach(function (t) {
		
		// select the appropriate engine for this test
		var engine;
		switch(t.engine) {
			case 'sql':engine=sql; break;
			case 'hybrid':engine=hybrid; break;
			case 'psql':engine=psql; break;
			case 'cypher':engine=cypher; break;
		}

		// chain promises for each test sequentially
		// NB we're not expecting anything to be passed from the previous promise (from the previous test)
		promise = promise.then(function() {
			// log the start time
			return [process.hrtime(), null];
		});

		// after we've logged the start time, run the tests the desired number of times
		// make sure to pass along the start time
		for (var i=0; i<iter; i++) {
			promise = promise.spread(function(startTime, prevResult) {
	    		return [startTime, engine.query(t.query, t.params)];
	    	});
		}

		// after we've run all iterations, this will be called after the last one
		promise = promise.spread(function(startTime, finalResult) {
			results.push([t.engine, process.hrtime(startTime), iter, finalResult]);
			// NB We're not returning anything to pass on to the next promise (for the next test)
		});
	});

	// after running all the tests a number of times, return the aggregated results
	return promise.then(function() {
		return [name, results];
	});
}

function report(name, results) {
	console.log("+" + "-".repeat(12 + name.length) + "+");
	console.log("| " + name.toUpperCase() +   " ALL DONE  |");
	console.log("+" + "-".repeat(12 + name.length) + "+\n");
	for (var i in results) {
		var result = results[i];
		console.log(result[0] + ": " + result[1][0] + "." + pad(result[1][1],9) + "s for " + result[2] + " rounds. Last result looked like: ");
		console.log("	", result[3]);
	}
}

function pad(num, size){ 
	return ('000000000' + num).substr(-size);
}