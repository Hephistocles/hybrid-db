# Install Neo4J
wget -O - https://debian.neo4j.org/neotechnology.gpg.key | sudo apt-key add -
echo 'deb http://debian.neo4j.org/repo stable/' >/tmp/neo4j.list
sudo mv /tmp/neo4j.list /etc/apt/sources.list.d
sudo apt-get update

sudo apt-get install neo4j


# Install PostgreSQL
# sudo apt-get install postgresql postgresql-contrib pgadmin3 postgresql-client
# sudo -u postgres createuser --superuser $USER
# sudo -u postgres createdb $USER

# echo "To set up the PostgreSQL server password, enter the following:"
# echo ""
# echo "sudo -u postgres psql"
# echo " postgres=# \password $USER"
# echo ""

## I'm using MySQL instead...

# <MySQL Installation Instructions Go Here>

