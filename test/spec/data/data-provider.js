var DataProvider = require("montage/data/service/data-provider").DataProvider;

describe("A DataProvider", function() {

    it("can be created", function () {
        expect(new DataProvider()).toBeDefined();
    });

    it("initially has an undefined data array", function () {
        expect(new DataProvider().data).not.toBeDefined();
    });

    it("accepts requests for data", function () {
        expect(new DataProvider().requestData).toEqual(jasmine.any(Function));
    });

});
