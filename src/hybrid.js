var pgp = require('pg-promise')();
var config = require("../config.json");
var _  = require('lodash');
var Graph  = require("./classes.js").Graph;
var Vertex = require("./classes.js").Vertex;
var Edge   = require("./classes.js").Edge;
var config = require("../config.json");
var aStar2 = require('./astar.js');

var Q = require("bluebird");


// for now we'll just have a singleton connection/graph instance
var connection;
var backedGraph
var graph;
var i=0;

var stats = {
	verticesFetched: 0,
	verticesFetchedFromDB: 0,
};

module.exports = 
{
	init: function(){

		// initialise our in-memory store as an empty graph
		graph = new Graph([], []);
		connection = pgp(config.auth.psql);
	},
	query: function(query, params){
		// I don't have a query language yet, so just perform a single query
		if (query === "astar") {
			return Q.all([getVertex(1), getVertex(1355)])
				.spread(function(v1, v2) {
					return aStar2({
					    start: v1,
					    isEnd: function(n) { return n.id === v2.id; },
					    neighbor: function(x) { 
					    	var promises = _.map(x.edges, function(edge) {
					    			// console.log("	getting vertex" + edge.endId);
					    			var start = process.hrtime();
						    		return getVertex(edge.endId, start, i++);
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
					    		if (b.id === a.edges[i].endId) {
					    			var d = parseInt(a.edges[i].properties.dist);
					    			return d;
					    		}
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
		} else if (query === "average latitude of neighbours within 3 hops") {
			return new Q.Promise(function(resolve, reject) {
				resolve("Not implemented 1");
			});
		} else if (query === "average latitude") {
			return new Q.Promise(function(resolve, reject) {
				resolve("Not implemented 2");
			});
		}

	},
	end: function() {
		console.log(stats);
		pgp.end();
	}
}

/* Return a single vertex from the graph if possible, otherwise from the DB.
	Also pre-fetches if a pre-fetcher has been specified. 
*/
function getVertex(id, startTime, num) {
	var v, p;
	var start = process.hrtime();
	stats.verticesFetched++;
	if (v = graph.vertices[id]) {
		return new Q.Promise(function(resolve, reject) {
			// console.log(num, "Roughly returned after ", process.hrtime(startTime));
			resolve(v);
		});
		// TODO?: maybe prefetch other data around here
	} else {
		// need to fetch from underlying DB
		stats.verticesFetchedFromDB++;
		
		// TODO? We always select from points JOIN edges -- make this a first-class view to save time?

		// NULL PREFETCHER
		// p = connection.query("SELECT edges.id AS eid, points.id AS id, lat, lng, id1, id2, dist FROM points JOIN edges ON edges.id1=points.id WHERE points.id=$1", [id])
		
		// LOOKAHEAD PREFETCHER
		// p = connection.query("SELECT edge_neighbourhood.id eid, points.id AS id, lat, lng, id1, id2, dist FROM points join edge_neighbourhood($1,$2) ON points.id=edge_neighbourhood.id1;", [id, 4])

		// BLOCK PREFETCHER
		// TODO: I wrote this drunk. Is this efficient? Answer: probably not.
		p = connection.query("SELECT edges.id eid, A.id id, lat, lng, id1, id2, dist FROM (SELECT points.id, points.lat, points.lng FROM points, (SELECT * FROM points where points.id=$1) Q WHERE points.lat>Q.lat-$2 AND points.lat<Q.lat+$2 AND points.lng<Q.lng+$2 AND points.lng>Q.lng-$2) A JOIN edges ON A.id=edges.id1;", [id, 1000])
			.then(function(d) {
				var newVertices = {};
				for (var i in d) {
					
					if (graph.vertices[d[i].id]) {
						// if this vertex is already in the graph, we should delete it.
						delete graph.vertices[d[i]];
					}
					var v2;
					if (d[i].id in newVertices) {
						v2 = newVertices[d[i].id];
					} else {
						v2 = new Vertex(parseInt(d[i].id), {id: parseInt(d[i].id), lat:parseInt(d[i].lat), lng:parseInt(d[i].lng)});
						newVertices[d[i].id] = v2;
					} 

					// make sure we grab the desired value as well as just prefetching!
					if (v2.id===id) v = v2;

					var e = new Edge(parseInt(d[i].eid), parseInt(d[i].id1), parseInt(d[i].id2), {label: d[i].eid, id1: parseInt(d[i].id1), id2:parseInt(d[i].id2), dist:parseInt(d[i].dist)});
					v2.addEdge(e);
					graph.addEdge(e);
				}
				
				for (var n_id in newVertices) {
					graph.addVertex(newVertices[n_id]);
				}
				return v;
			}).catch(function(error){
			    //logs out the error
			    console.error(error);
			});
	}

	return p;
}

function heuristic_cost_estimate(v1, v2) {
	// from http://www.movable-type.co.uk/scripts/latlong.html
	var R = 6371; // kilometres
	var φ1 = toRadians(v1.properties.lat);
	var φ2 = toRadians(v2.properties.lat);
	var Δφ = toRadians(v2.properties.lat-v1.properties.lat);
	var Δλ = toRadians(v2.properties.lng-v1.properties.lng);

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	Math.cos(φ1) * Math.cos(φ2) *
	Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}

function toRadians(num) {
	return num *Math.PI / 180;
}