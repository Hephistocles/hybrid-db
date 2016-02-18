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

function heuristic_cost_estimate(start, goal) {

}

function aStar(v_start, v_goal) {
    var ClosedSet = {},    	  // The set of nodes already evaluated.
    queue = [{priority: heuristic_cost_estimate(v_start, v_goal), vertex:v_start}],
    Came_From = {},    // The map of navigated nodes.
    g_score = {};

    g_score[v_start.id] = 0;    // Cost from start along best known path.


    while (queue.length > 0) {
        var current = queue.shift().vertex;
        if (current === v_goal) {
            return reconstruct_path(Came_From, current)
        }

        ClosedSet[current.id] = true;
        for (var i in current.edges) {
        	var edge = current.edges[i];
        	if (edge.endId in ClosedSet) continue; // ignore neighbours which are already evaluated

        	var tentative_score = g_score[current.id] + edge.properties.dist;

        	if (current.id in g_score && tentative_score >= g_score[edge.endId]) continue; // This is not a better path
        	
        	addToPQ(OpenSet, graph.getVertex(edge.endId));
        	
        	Came_From[edge.endId] = current;
        	g_score[edge.endId] = tentative_score;
        	f_score[edge.endId] = g_score[edge.endId] + heuristic_cost_estimate(graph.getVertex(edge.endId), v_goal)
        }
    }

    return [];
}

function reconstruct_path(Came_From, current) {
	console.log(arguments);
}

function heuristic_cost_estimate(v1, v2) {
	// from http://www.movable-type.co.uk/scripts/latlong.html
	var R = 6371000; // metres
	var φ1 = v1.lat.toRadians();
	var φ2 = v2.lat.toRadians();
	var Δφ = (v2.lat-v1.lat).toRadians();
	var Δλ = (v2.lng-v1.lng).toRadians();

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}