MATCH (n) DETACH DELETE n;

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM "file:///home/christoph/Documents/dev/hybrid-db/data/raw/points.dat" AS l
CREATE (p:Point {id: toInt(l.id), lat: toInt(l.lat), lng: toInt(l.lng)});

CREATE INDEX ON :Point(id);

USING PERIODIC COMMIT 1000
LOAD CSV WITH HEADERS FROM "file:///home/christoph/Documents/dev/hybrid-db/data/raw/edges.dat" AS l
MATCH (p1:Point {id: toInt(l.id1) }), (p2:Point {id: toInt(l.id2)})
CREATE (p1)-[:Road {dist: toInt(l.dist) }]->(p2);
