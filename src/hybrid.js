var Q      = require("q");
var mysql  = require('promise-mysql');
var _  = require('lodash');
var Prefetchers  = require("./prefetchers.js");
var Graph  = require("./classes.js").Graph;
var Vertex = require("./classes.js").Vertex;
var Edge   = require("./classes.js").Edge;
var config = require("../config.json");
var aStar2 = require('./astar.js');


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
			return Q.all([getVertex(1), getVertex(1355)])
				.spread(function(v1, v2) {
					return aStar2({
					    start: v1,
					    isEnd: function(n) { return n.id === v2.id; },
					    neighbor: function(x) { 
					    	// console.log("Looking for neighbours of " + x.id);
					    	var promises = _.map(x.edges, function(edge) {
					    			// console.log("	getting vertex" + edge.endId);
						    		return getVertex(edge.endId);
						    	});
					    	return Q.all(promises)
						    	.then(function(args) {
						    		// console.log("	found neighs");
						    		// console.log(args);
						    		return args;
						    	});
					    },
					    distance: function(a, b) { 
					    	for (var i in a.edges) {
					    		if (b.id === a.edges[i].id2) return a.edges[i].dist;
					    	}
					    },
					    heuristic: function(x) { 
					    	return heuristic_cost_estimate(x, v2);
					    },
					    hash: function(x) {
					    	return ""+ x.id;
					    }
					  });
				});		  

		},
		end: function() {
			// console.log("Goodnight!");
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
		// console.log("No need for DB for " + id);
	} else {

		// need to fetch from underlying DB
		// TODO? We always select from points JOIN edges -- make this a first-class view to save time?
		// console.log("Getting sometrhing");
		p = connection.query("SELECT edges.id AS eid, points.id AS id, lat, lng, id1, id2, dist FROM points JOIN edges ON edges.id1=points.id WHERE points.id=?", [id])
		.then(function(d) {
			// console.log("Got something for " + id);
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
				// console.log("Went to DB for " + id);
				return v;
			}).catch(function(error){
			    //logs out the error
			    console.error(error);
			});
	}
	
	// p will be resolved with a vertex, one way or the other
	// TODO: We could either wait for the prefetcher to finish before proceeding, or let it go on in the background
	// Pros of letting it finish: minimise # queries, since we definitely won't request something that is being fetched
	// Pros of carrying on without it: minimise amount of time wasted waiting around.
	// Must test!
	// return p.then(function(vertex) {
	// 	// even if we do wait for the prefetcher, we must still return the vertex itself!
	// 	return [vertex, prefetcher.fetchAroundVertex(vertex, graph, connection)];
	// }).spread(function (vertex, prefetchResult) {
	// 	return vertex;
	// });

	return p;
}


function aStar(v_start, v_goal) {
    var ClosedSet = {},    	  // The set of nodes already evaluated.
    queue = [{priority: heuristic_cost_estimate(v_start, v_goal), vertex:v_start}],
    Came_From = {},    // The map of navigated nodes.
    g_score = {};

    g_score[v_start.id] = 0;    // Cost from start along best known path.
    var p = Q(true);

    return p.then(function body() {
    	// console.log("Examining " + queue[0].vertex.id);
    	if (queue.length < 1) return Q.reject("No path found or something wrong.");
    	var current = queue.shift().vertex;
    	if (current === v_goal) {
    		return Q(reconstruct_path(Came_From, current));
    	}
    	ClosedSet[current.id] = true;
    	var newNeighbours = [];
    	for (var i in current.edges) {
    		var edge = current.edges[i];
        	if (edge.endId in ClosedSet) continue; // ignore neighbours which are already evaluated

        	var tentative_score = g_score[current.id] + edge.properties.dist;

        	if (current.id in g_score && tentative_score >= g_score[edge.endId]) continue; // This is not a better path
        	
        	newNeighbours.push(getVertex(edge.endId));
        }

        return Q.all(newNeighbours)
	        .then(function(neighbours) {
	        	for (var i in neighbours) {
	        		var neighbour = neighbours[i];
	        		var my_f = g_score[edge.endId] + heuristic_cost_estimate(neighbour, v_goal);

	        		one: for (var j=0; j<queue.length; j++) {
		        		// if this vertex is already in the priority queue, we should remove it
		        		if (queue[j].vertex.id === neighbour.id) {
		        			queue.splice(j,1);
		        			continue;
		        		}
		        		if (queue[j].priority >= my_f) break one;
	        		}
		        	// insert the new vertex at position `j`
		        	queue.splice(j, 0, {priority: my_f, vertex:neighbour});
		        	j+=1;
		        	// check the rest of the queue for dupes
		        	for (j; j<queue.length; j++) {
		        		if (queue[j].vertex.id === neighbour.id) queue.splice(j,1);
		        	}
		        	
		        	Came_From[edge.endId] = current;
		        	g_score[edge.endId] = tentative_score;	
		        }
		    })
        	.then(body);
    });
}

function reconstruct_path(Came_From, current) {
	// console.log("Done!");
	// console.log(arguments);
}

function heuristic_cost_estimate(v1, v2) {
	// from http://www.movable-type.co.uk/scripts/latlong.html
	var R = 6371000; // metres
	var φ1 = v1.properties.lat.toRadians();
	var φ2 = v2.properties.lat.toRadians();
	var Δφ = (v2.properties.lat-v1.properties.lat).toRadians();
	var Δλ = (v2.properties.lng-v1.properties.lng).toRadians();

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	Math.cos(φ1) * Math.cos(φ2) *
	Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}


if(typeof(Number.prototype.toRadians) === "undefined") {
    Number.prototype.toRadians = function () {
        return this * Math.PI / 180;
    }
}