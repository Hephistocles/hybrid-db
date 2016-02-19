var assert = require('assert')
, StringSet = require('Set')
, Heap = require('heap')
, dict = require('dict')
, Q = require('bluebird')
, async = require('async');

module.exports = aStar;

function aStar(params) {
	assert.ok(params.start !== undefined);
	assert.ok(params.isEnd !== undefined);
	assert.ok(params.neighbor);
	assert.ok(params.distance);
	assert.ok(params.heuristic);
	if (params.timeout === undefined) params.timeout = Infinity;
	assert.ok(!isNaN(params.timeout));
	var hash = params.hash || defaultHash;
	var deferred = Q.defer();

	var startNode = {
		data: params.start,
		g: 0,
		h: params.heuristic(params.start),
	};
	var bestNode = startNode;
	startNode.f = startNode.h;
	// leave .parent undefined
	var closedDataSet = new StringSet();
	var openHeap = new Heap(heapComparator);
	var openDataMap = dict();
	openHeap.push(startNode);
	openDataMap.set(hash(startNode.data), startNode);
	var startTime = new Date();
	async.whilst (
		function() { return openHeap.size();},
		function(wcb) {
			if (new Date() - startTime > params.timeout) {
				return wcb({
					status: 'timeout',
					cost: bestNode.g,
					path: reconstructPath(bestNode),
				});
			}
			var node = openHeap.pop();
			openDataMap.delete(hash(node.data));
			if (params.isEnd(node.data)) {
				// done
				return wcb({
					status: 'success',
					cost: node.g,
					path: reconstructPath(node),
				});
			}
			// not done yet
			closedDataSet.add(hash(node.data));


			params.neighbor(node.data)
				.then(function(neighbors) {
					for (var i = 0; i < neighbors.length; i++) {
						var neighborData = neighbors[i];
						if (closedDataSet.contains(hash(neighborData))) {
								// skip closed neighbors
								continue;
							}
							var gFromThisNode = node.g + params.distance(node.data, neighborData);
							var neighborNode = openDataMap.get(hash(neighborData));
							var update = false;
							if (neighborNode === undefined) {
								// add neighbor to the open set
								neighborNode = {
									data: neighborData,
								};
								// other properties will be set later
								openDataMap.set(hash(neighborData), neighborNode);
							} else {
								if (neighborNode.g < gFromThisNode) {
									// skip this one because another route is faster
									continue;
								}
								update = true;
							}
							// found a new or better route.
							// update this neighbor with this node as its new parent
							neighborNode.parent = node;
							neighborNode.g = gFromThisNode;
							neighborNode.h = params.heuristic(neighborData);
							neighborNode.f = gFromThisNode + neighborNode.h;
							if (neighborNode.h < bestNode.h) bestNode = neighborNode;
							if (update) {
								openHeap.heapify();
							} else {
								openHeap.push(neighborNode);
							}
						}
						return wcb(null, 42);
					});

	},
	function(err, n) {
		if (err) {
			if (err.status === 'success')
				deferred.resolve(err);
			deferred.reject(err);
		}
		// all the neighbors of every accessible node have been exhausted
		else {
			deferred.resolve({
				status: "noPath",
				cost: bestNode.g,
				path: reconstructPath(bestNode),
			});
		}
	});
	return deferred.promise;
}

function reconstructPath(node) {
	if (node.parent !== undefined) {
		var pathSoFar = reconstructPath(node.parent);
		pathSoFar.push(node.data);
		return pathSoFar;
	} else {
		// this is the starting node
		return [node.data];
	}
}

function defaultHash(node) {
	return node.toString();
}

function heapComparator(a, b) {
	return a.f - b.f;
}