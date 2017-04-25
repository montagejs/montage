// Montage promises are implemented in the bluebird package.  If Montage Require is
// used for bootstrapping, this file will never actually be required, but will
// be injected instead.

Promise = global.Promise || require("bluebird");

// Patch "Promise.is" to support native promise
Promise.is = function (promise) {
	return promise && typeof promise.then === 'function';
}

// Polyfill "Promise.prototypefinally" to support finally
if (Promise.prototype.hasOwnProperty('finally') === false) {
	Promise.prototype['finally'] = function finallyPolyfill(callback) {
		var constructor = this.constructor;
		return this.then(function(value) {
				return constructor.resolve(callback()).then(function() {
					return value;
				});
			}, function(reason) {
				return constructor.resolve(callback()).then(function() {
					throw reason;
				});
			});
	};
}

exports.Promise = Promise;