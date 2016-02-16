function handleResult(result) {
	console.log(result);
}


// MYSQL

var mysql = require('promise-mysql');
var connection;

mysql.createConnection({
	host     : 'localhost',
	user     : 'hybrid',
	database : 'hybrid'
})
.then(function(conn){
	connection = conn;
})
.then(function() {
	return connection.query('select * from points limit 1')
})
.then(handleResult)
.then(function(){
	connection.end();
});


// NEO4J
var r=require("request");
var txUrl = "http://localhost:7474/db/data/transaction/commit";
function cypher(query,params,cb) {
	r.post({
		uri:txUrl,
		'auth': {
			'user': 'neo4j',
			'pass': 'LockDown1'
		},
		json:{statements:[{statement:query,parameters:params}]}},
		function(err,res) { cb(
			JSON.stringify(res.body))})
}

var query="MATCH (n1)-[r]->(n2) RETURN n1, r, n2 LIMIT {limit}"
var params={limit: 2}

cypher(query,params,handleResult)