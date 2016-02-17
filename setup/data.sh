TMP=`mktemp`
# download data
# wget -O - -o /dev/null http://www.cc.gatech.edu/dimacs10/archive/data/clustering/cnr-2000.graph.bz2 | bzip2 -d > italy.dat
# wget -O $TMP -o /dev/null http://files.grouplens.org/datasets/movielens/ml-100k.zip;
# 	unzip $TMP ml-100k/u.data ml-100k/u.item ml-100k/u.genre ml-100k/u.user ml-100k/u.occupation -d data
# rm -r data/raw
# mv data/ml-100k data/raw

mkdir -p data/raw

# get vertices
echo "id,lat,lng" > data/raw/points.dat;
wget -O - http://www.dis.uniroma1.it/challenge9/data/USA-road-d/USA-road-d.NY.co.gz |
	gunzip |
	egrep -v '^[cp]' | # strip comments
	tr " " "," | # convert spaces to commas, and on next line remove first two chars
	sed 's/^..//' >> data/raw/points.dat;

# get arcs
echo "id1,id2,dist" > data/raw/edges.dat;
wget -O - http://www.dis.uniroma1.it/challenge9/data/USA-road-d/USA-road-d.NY.gr.gz |
	gunzip |
	egrep -v '^[cp]' | # strip comments
	tr " " "," | # convert spaces to commas, and on next line remove first two chars
	sed 's/^..//' >> data/raw/edges.dat;


# insert into Neo4J
neo4j-shell -c < import.cql;

# insert into MySql
mysql --local-infile=1 -u hybrid hybrid < import.sql