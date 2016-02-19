module.exports = [
		{
			name: "Samples",
			tests: [
				function(context) {
					return context.sql.query('select * from points limit 1', {});
				},
				function(context) {
					return context.cypher.query("MATCH (n1 {id:1})-[r]->(n2) RETURN n2 LIMIT 2", {});
				},
				function(context) {
					return context.hybrid.query("", {id:1})
				},
				function(context) {
					return context.psql.query('select astarroute(1, 1355)', {});
				}
			]
		}
	];
		