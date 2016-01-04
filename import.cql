MATCH (n) DETACH DELETE n;

LOAD CSV WITH HEADERS FROM "file:///home/christoph/Main/dev/db/data/raw/points.dat" AS l FIELDTERMINATOR ' '
CREATE (p:Point {id: toInt(l.id), lat: toInt(l.lat), lng: toInt(l.lng)});

CREATE INDEX ON :Point(id);

USING PERIODIC COMMIT 500
LOAD CSV WITH HEADERS FROM "file:///home/christoph/Main/dev/db/data/raw/edges.dat" AS l FIELDTERMINATOR ' '
MATCH (p1:Point {id: toInt(l.id1) }), (p2:Point {id: toInt(l.id2)})
CREATE (p1)-[:Road {dist: toInt(l.dist) }]->(p2);
