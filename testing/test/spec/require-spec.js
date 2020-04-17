  /*global require,exports,describe,it,expect */
describe("require-spec", function () {

  beforeEach(function () {
    /* ... Set up your object ... */
  });

  afterEach(function () {
    /* ... Tear it down ... */
  });

  //
  it("load core module", function () {
    var montageRequire = require("montage/core/core");
    expect(typeof montageRequire.Montage).toEqual("function");
  });

  it("load alias module", function () {
    var montageRequire = require("montage");
    expect(typeof montageRequire.Montage).toEqual("function");
  });

  it("load inject module", function () {
    var URL = require("montage/core/mini-url");
    expect(typeof URL.resolve).toEqual("function");
  });

  it("load test-controller module", function () {
    var TestController = require('montage-testing/test-controller').TestController;
    expect(typeof TestController).toEqual("function");
  });

});
