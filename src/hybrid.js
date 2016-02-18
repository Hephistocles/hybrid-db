var Q      = require("q");
var mysql  = require('promise-mysql');
var _  = require('lodash');
var Prefetchers  = require("./prefetchers.js");
var Graph  = require("./classes.js").Graph;
var Vertex = require("./classes.js").Vertex;
var Edge   = require("./classes.js").Edge;
var config = require("../config.json");

// for now we'll just have a singleton connection/graph instance
var connection;
var backedGraph
var prefetcher;
var graph;


module.exports = 
	{
		init: function(prefetcherType){

			// initialise our in-memory store as an empty graph
			graph = new Graph([], []);
			switch (prefetcherType) {
				case "lookahead": prefetcher = Prefetchers.Lookahead; break;
				case "block": prefetcher = Prefetchers.Block; break;
				default: prefetcher = Prefetchers.Null; break;
			}
			return initSql();
		},
		query: function(query, params){
			// I don't have a query language yet, so just perform a single query
			return getVertex(params.id);

		},
		end: function() {
			connection.end();
		}
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
	} else {
		return Q(connection);
	}
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

		console.log("Went to DB");
		// need to fetch from underlying DB
		// TODO? We always select from points JOIN edges -- make this a first-class view to save time?
		p = connection.query("SELECT edges.id AS eid, points.id AS id, lat, lng, id1, id2, dist FROM points JOIN edges ON edges.id1=points.id WHERE edges.id=?", [id])
			.then(function(d) {
				for (var i in d) {
					
					if (graph.vertices[d[i].id]) {
						// if this vertex is already in the graph, we should delete it.
						delete graph.vertices[d[i]];
					}
					if (v === undefined) {
						v = new Vertex(d[i].id, {id: d[i].id, lat:d[i].lat, lng:d[i].lng});
					}
					var e = new Edge(d[i].eid, d[i].id1, d[i].id2, {label: d[i].eid, id1: d[i].id1, id2:d[i].id2, dist:d[i].dist});
					v.addEdge(e);
					graph.addEdge(e);
				}
				
				graph.addVertex(v);
				return v;
			});
	}
	
	// p will be resolved with a vertex, one way or the other
	// TODO: We could either wait for the prefetcher to finish before proceeding, or let it go on in the background
	// Pros of letting it finish: minimise # queries, since we definitely won't request something that is being fetched
	// Pros of carrying on without it: minimise amount of time wasted waiting around.
	// Must test!
	return p.then(function(vertex) {
		// even if we do wait for the prefetcher, we must still return the vertex itself!
		return [vertex, prefetcher.fetchAroundVertex(vertex, graph, connection)];
	}).spread(function (vertex, prefetchResult) {
		return vertex;
	});

	return p;
}