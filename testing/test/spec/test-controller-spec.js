/*global require,exports,describe,it,expect */
describe("test-controller", function () {
	
	beforeEach(function () {
		/* ... Set up your object ... */
	});
	
	afterEach(function () {
		/* ... Tear it down ... */
	});

	it("load test-controller module", function () {
	    var TestController = require('montage-testing/test-controller').TestController;
	    expect(typeof TestController).toEqual("function");
	});
});