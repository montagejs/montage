
var Promise = require("montage/core/promise").Promise;

describe("core/promise-spec", function () {

    describe("deferred promise", function () {

        var deferred = Promise.defer();

        it("is not fulfilled", function () {
            expect(deferred.promise.isFulfilled()).toBe(false);
        });

        it("is not resolved", function () {
            expect(deferred.promise.isResolved()).toBe(false);
        });

        it("is not rejected", function () {
            expect(deferred.promise.isRejected()).toBe(false);
        });
    });

    describe("fulfilled promise", function () {

        var deferred = Promise.defer();
        deferred.resolve(); // vary resolution

        it("is fulfilled", function () {
            expect(deferred.promise.isFulfilled()).toBe(true);
        });

        it("is resolved", function () {
            expect(deferred.promise.isResolved()).toBe(true);
        });

        it("is not rejected", function () {
            expect(deferred.promise.isRejected()).toBe(false);
        });

    });

    describe("rejected promise", function () {

        var deferred = Promise.defer();
        deferred.reject();
        // or deferred.resolve(Promise.reject())
        // or vary rejection error and reason

        it("is not fulfilled", function () {
            expect(deferred.promise.isFulfilled()).toBe(false);
        });

        it("is resolved", function () {
            expect(deferred.promise.isResolved()).toBe(true);
        });

        it("is rejected", function () {
            expect(deferred.promise.isRejected()).toBe(true);
        });

    });

    describe("partially resolved promise", function () {

        var d1 = Promise.defer();
        var d2 = Promise.defer();
        d1.resolve(d2.promise);

        it("is not fulfilled", function () {
            expect(d1.promise.isFulfilled()).toBe(false);
        });

        it("is not fully resolved", function () {
            expect(d1.promise.isResolved()).toBe(false);
        });

        it("is not rejected", function () {
            expect(d1.promise.isRejected()).toBe(false);
        });
    });

    describe("deferred then fulfilled promise", function () {

        var d1 = Promise.defer();
        var d2 = Promise.defer();
        d1.resolve(d2.promise);
        d2.resolve(); // vary value

        it("is fulfilled", function () {
            expect(d1.promise.isFulfilled()).toBe(true);
        });

        it("is fully resolved", function () {
            expect(d1.promise.isResolved()).toBe(true);
        });

        it("is not rejected", function () {
            expect(d1.promise.isRejected()).toBe(false);
        });
    });

    describe("deferred then rejected promise", function () {

        var d1 = Promise.defer();
        var d2 = Promise.defer();
        d1.resolve(d2.promise);
        d2.reject(); // vary method and rejection

        it("is not fulfilled", function () {
            expect(d1.promise.isFulfilled()).toBe(false);
        });

        it("is fully resolved", function () {
            expect(d1.promise.isResolved()).toBe(true);
        });

        it("is rejected", function () {
            expect(d1.promise.isRejected()).toBe(true);
        });
    });

    describe("delayed promise", function () {

        var delayed = Promise.ref(10).delay(100);
        var value;

        delayed.then(function (_value) {
            value = _value;
        });

        it("is eventually fulfilled", function () {
            waitsFor(function () {
                return value;
            }, 1100);
            runs(function () {
                expect(value).toBe(10);
            });
        });

        it("can time out", function () {
            return Promise.delay(100)
            .timeout(50)
            .then(function () {
                expect(true).toBe(false);
            }, function (reason) {
                expect(reason).toBe("Timed out");
            })
        });

    });

    describe("thenable", function () {

        describe("fulfiller", function () {

            var ten;

            Promise.when({
                then: function (fulfill) {
                    fulfill(10);
                }
            }, function (value) {
                ten = value;
            });

            waitsFor(function () {
                return ten;
            }, 100);

            it("fulfills", function () {
                expect(ten).toEqual(10);
            });

        });

        describe("rejecter", function () {

            var done, reason, error;

            Promise.fail({
                then: function (fulfill, reject) {
                    reject("reason", new Error("reason"));
                }
            }, function (_reason, _error) {
                done = true;
                reason = _reason;
                error = _error;
            });

            waitsFor(function () {
                return done;
            }, 100);

            it("rejects", function () {
                expect(reason).toEqual("reason");
                expect(error.message).toEqual("reason");
            });

        });

    });

});
