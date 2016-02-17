module.export = {
	Lookahead: LookaheadPrefetcher,
	Block: BlockPrefetcher,
}


function Prefetcher() {}
Prefetcher.prototype = {};

// Lookahead prefetcher - fetch current node then also fetch all neighbours:
// Use a variation of SELECT * FROM vertices WHERE id IN (2, 5, 11);
// (Potentially repeatedly to achieve desired depth).
function LookaheadPrefetcher(){};
extend(Prefetcher, LookaheadPrefetcher);

// Block prefetcher - try to use semantic locality of reference
// Use a variation of SELECT * FROM vertices WHERE lat>1 and lat<2 and lng<1 and lng>0;
function BlockPrefetcher(){};
extend(Prefetcher, BlockPrefetcher);