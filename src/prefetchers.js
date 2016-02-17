var utils = require("./utils.js");
var Vertex = require("./classes.js").Vertex;
var Edge = require("./classes.js").Edge;

var Prefetcher = {
	fetchAroundVertex: function(vertex, graph, connection) {console.log("Fetched naught")}
};

// Lookahead prefetcher - fetch current node then also fetch all neighbours:
// Use a variation of SELECT * FROM vertices WHERE id IN (2, 5, 11);
// (Potentially repeatedly to achieve desired depth).
var LookaheadPrefetcher = {
	fetchAroundVertex: function(vertex, graph, connection) {console.log("Fetched naught")}
};

// Block prefetcher - try to use semantic locality of reference
// Use a variation of SELECT * FROM vertices WHERE lat>1 and lat<2 and lng<1 and lng>0;
var BlockPrefetcher = {
	fetchAroundVertex: function(vertex, graph, connection) {

		return connection.query("SELECT edges.id AS eid, points.id AS id, lat, lng, id1, id2, dist FROM points JOIN edges ON edges.id1=points.id WHERE lat>=? and lat<? and lng>=? and lng<?",
			[vertex.properties.lat-1000, vertex.properties.lat+1000, vertex.properties.lng-5000, vertex.properties.lng+5000])
			.then(function(d) {
				var newVertices = {};
				for (var i in d) {
					
					if (graph.vertices[d[i].id]) {
						// if this vertex is already in the graph, we should delete it.
						delete graph.vertices[d[i]];
					}
					var v;
					if (d[i].id in newVertices) {
						v = newVertices[d[i].id];
					} else {
						v = new Vertex(d[i].id, {id: d[i].id, lat:d[i].lat, lng:d[i].lng});
						newVertices[d[i].id] = v;
					} 
					var e = new Edge(d[i].eid, d[i].id1, d[i].id2, {label: d[i].eid, id1: d[i].id1, id2:d[i].id2, dist:d[i].dist});
					v.addEdge(e);
					graph.addEdge(e);
				}
				
				for (var id in newVertices) {
					graph.addVertex(newVertices[id]);
				}
			})
	}
};

module.exports = {
	Null: Prefetcher,
	Lookahead: LookaheadPrefetcher,
	Block: BlockPrefetcher,
};