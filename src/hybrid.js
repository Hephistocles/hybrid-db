var Q = require("q");

module.exports = 
	{
		init: function(){return Q(true);},
		query: function(query, params){
			return Q(true);
		},
		end: function() {return Q(true);}
	};