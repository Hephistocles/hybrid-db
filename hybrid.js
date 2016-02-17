var Q      = require("q");
var mysql  = require('promise-mysql');
var Graph  = require("./classes.js").Graph;
var Vertex = require("./classes.js").Vertex;
var Edge   = require("./classes.js").Edge;
var config = require("../config.json");

// for now we'll just have a singleton connection/graph instance
var connection;
var backedGraph
var graph;


module.exports = 
	{
		init: function(){

			// initialise our in-memory store as an empty graph
			graph = new Graph([], []);
			return initSql();
		},
		query: function(query, params){
			// I don't have a query language yet, so just perform a single query
			// assume we want to fetch the vertex with ID 1
			console.log("Getting v");
			return getVertex(1);

		},
		end: function() {return Q(true);}
	};

/* Initialise a connection to the underlying SQL Database */
function initSql() {
	// initialise a connection to the underlying DB
	if (connection === null || connection === undefined) {
		return mysql.createConnection({
				host     : config.auth.sql.host,
				user     : config.auth.sql.user,
				password : config.auth.sql.password,
				database : config.auth.sql.database
			})
			.then(function(conn) {
				connection = conn;
				return conn;
			});
	} else return Q(connection);
}

/* Return a single vertex from the graph if possible, otherwise from the DB.
	Also pre-fetches if a pre-fetcher has been specified. 
	*/
function getVertex(id) {

	var v, p;
	if (v = graph.vertices[id]) {
		// prefetch other data around here
		p = Q(v);
	} else {

		// need to fetch from underlying DB
		this.connection.query("SELECT * FROM points WHERE id=?", [id])
			.then(function(d) {
				v = new Vertex(id, d);
				graph.addVertex(v); 
				p = v;
			})
	}
	
	// p will be resolved with a vertex, one way or the other
	p.then(function(vertex) {
		//  prefetcher.fetchAroundVertex(vertex, graph);
	});

	// Note that we're not waiting for the prefetcher to finish before returning this vertex
	return p;
}