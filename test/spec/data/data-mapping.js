var DataMapping = require("montage/data/service/data-mapping").DataMapping;

describe("A DataMapping", function() {

   function ClassA(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    function ClassB(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    it("can be created", function () {
        expect(new DataMapping()).toBeDefined();
    });

    it("copies raw data properties by default", function () {
        var object = {x: 42},
            random = Math.random(),
            data = new ClassA(1, 2, object, random),
            mapped = new ClassB();
        new DataMapping().mapRawDataToObject(data, mapped);
        expect(mapped).toEqual(new ClassB(1, 2, object, random));
    });

});
