module.exports = {
	
	extend: function(Dog, Corgi) {
	    Corgi.prototype = new Dog();
	    Corgi.prototype.constructor = Corgi;
	},

	getIndexBy: function(_) {
		return function(arr, key) {
			_.mapValues(
				_.groupBy(arr, key),
				function(a) {
					return a[0];
				}
			);
		}
	}
}