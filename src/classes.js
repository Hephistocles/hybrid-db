var _ = require("lodash");

var utils = require("./utils.js");
_.indexBy = utils.getIndexBy(_);

// Craql 4.2

// Each vertex has an ID, a set of
// properties, and a set of labelled edges. Vertices are stored in a hash table (dictionary) structure
// indexed by the ID for quick lookup. The set of labelled edges is maintained as a hash table
// indexed by label. Each edge is a 3-tuple of a start ID, end ID, and a hash of properties. Edges
// only refer to their start and end vertices by an ID rather than a reference, because the data may
// not be present yet in the graph. This allows for lazily loading vertices as required, but means
// that vertex IDs are duplicated by edges.

function Graph(vertices, edges) {

    return {
        vertices: _.indexBy(vertices, 'id'),
        edges: _.indexBy(edges, 'label')
    };
}
Graph.prototype = {};

function Vertex(id, properties) {
    
    return {
        id: id,
        properties: properties,
        edges: []
    };
}
Vertex.prototype = {
    addEdge: function(edge) {
        this.edges.push(edge);
    }
};

function Edge(label, startId, endId, properties) {

    return {
        label: label,
        startId: startId,
        endId: endId, 
        properties: properties
    };
}
Edge.prototype = {};