
var PromiseQueue = require("montage/core/promise-queue").PromiseQueue;

describe("core/promise-queue-spec", function () {

    describe("get then put", function () {
        var queue, got;

        it("sets up a queue", function () {
            queue = PromiseQueue.create().init();
            got = queue.get();
            queue.put(20);
            got.end();
        });

        waitsFor(function () {
            return got.isFulfilled();
        });

        it("eventually get the put value", function () {
            expect(got.valueOf()).toBe(20);
        });
    });

    describe("put then get", function () {
        var queue, got;

        it("sets up a queue", function () {
            queue = PromiseQueue.create().init();
            queue.put(10)
            got = queue.get();
            got.end();
        });

        waitsFor(function () {
            return got.isFulfilled();
        });

        it("eventually get the put value", function () {
            expect(got.valueOf()).toBe(10);
        });

    });

});

