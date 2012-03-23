
var Promise = require("montage/core/promise").Promise;
var PromiseConnection = require("montage/core/promise-connection").PromiseConnection;

describe("core/promise-connection-spec", function () {

    var channel = new MessageChannel();
    var remote, local;

    it("can create a remote object", function () {
        PromiseConnection
        .create()
        .init(channel.port1, 36);
    });

    it("can create a connection", function () {
        remote = PromiseConnection
        .create()
        .init(channel.port2);
    });

    it("can call a remote function", function () {
        local = remote.invoke("toString", 36);
    });

    waitsFor(function () {
        return local.isFulfilled();
    })

    it("gets the right result eventually", function () {
        expect(local.valueOf()).toBe("10");
    });

});

