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
.then(function(result){
    console.log(result);
    connection.end();
});