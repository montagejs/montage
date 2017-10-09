var DataStream = require("montage/data/service/data-stream").DataStream,
    Montage = require("montage").Montage;

describe("A DataStream", function() {

    var DATA1 = [{a: 1, b: 2}, {a: 3, b: 4}],
        DATA2 = [{a: 5, b: 6}];

    function makeCounter(counters, index) {
        return function (value) {
            counters[index] += 1;
            return value;
        };
    }

    function makeArray(length, fill) {
        var array = Array(length);
        while (length > 0) {
            array[length - 1] = fill;
            length -= 1;
        }
        return array;
    }

    it("can be created", function () {
        expect(new DataStream()).toBeDefined();
    });

    it("has a an initially empty data array", function () {
        var stream = new DataStream(),
            data = stream.data;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toEqual(0);
    });

    it("has a data array which doesn't change even when its contents do", function () {
        var stream = new DataStream(),
            data = stream.data;
        stream.addData(DATA1);
        expect(stream.data).toBe(data);
    });

    it("provides the data it receives through its data array", function () {
        var stream = new DataStream();
        stream.addData(DATA1);
        expect(stream.data).toEqual(DATA1);
    });

    it("provides the data it receives to objects bound to its data array", function () {
        var stream = new DataStream(),
            bound = new (Montage.specialize({}))();
        bound.stream = stream;
        bound.defineBinding("data", {"<-": "stream.data"});
        bound.defineBinding("foos", {"<-": "stream.data.map{foo}"});
        stream.addData([{foo: 1, bar: 2}, {foo: 3, bar: 4}]);
        expect(bound.data).toEqual([{foo: 1, bar: 2}, {foo: 3, bar: 4}]);
        expect(bound.foos).toEqual([1, 3]);
    });

    it("accepts requests for data", function () {
        expect(new DataStream().requestData).toEqual(jasmine.any(Function));
    });

    it("is a promise-like thenable and catchable", function () {
        var stream = new DataStream();
        expect(stream.then).toEqual(jasmine.any(Function));
        expect(stream.catch).toEqual(jasmine.any(Function));
    });

    it("gets fulfilled with the data it receives", function (done) {
        var stream = new DataStream(),
            counters = [0, 0, 0, 0],
            promises = [];
        // Feed data to the stream, setting up fulfillment callback counters
        // before, during, and after this process.
        promises.push(stream.then(makeCounter(counters, 0)));
        stream.addData(DATA1);
        promises.push(stream.then(makeCounter(counters, 1)));
        stream.addData(DATA2);
        promises.push(stream.then(makeCounter(counters, 2)));
        stream.dataDone();
        promises.push(stream.then(makeCounter(counters, 3)));
        // Verify that the stream was fulfilled with the expected data.
        Promise.all(promises).then(function (value) {
            var expected = DATA1.concat(DATA2);
            expect(value).toEqual([expected, expected, expected, expected]);
            return null;
        }).catch(function (reason) {
            fail(reason);
            return null;
        });
        // Verify that all of the stream fulfillment callbacks were called once
        // and only once. Use a timeout to allow any possible fulfillments and
        // rejection to be triggered before the verification.
        setTimeout(function () {
            expect(counters).toEqual([1, 1, 1, 1]);
            done();
        }, 10);
    });

    it("can have its fulfillment handling deferred", function (done) {
        var stream = new DataStream();
        // Feed data to the stream without setting up any callbacks.
        stream.addData(DATA1);
        stream.addData(DATA2);
        stream.dataDone();
        // Verify that the stream was fulfilled with the expected data but defer
        // the verification using a timeout.
        setTimeout(function () {
            stream.then(function (value) {
                expect(value).toEqual(DATA1.concat(DATA2));
                done();
                return null;
            }).catch(function (reason) {
                fail(reason);
                done();
                return null;
            });
        }, 10);
    });

    it("doesn't get fulfilled more than once", function (done) {
        var stream = new DataStream(),
            counters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            promises = [];
        // Attempt to trigger the stream fulfillment and rejection multiple
        // times, setting up callback counters before and after each attempt.
        promises.push(stream.then(makeCounter(counters, 0), makeCounter(counters, 1)));
        stream.dataDone();
        promises.push(stream.then(makeCounter(counters, 2), makeCounter(counters, 3)));
        stream.dataError();
        promises.push(stream.then(makeCounter(counters, 4), makeCounter(counters, 5)));
        stream.addData(DATA1);
        stream.dataError();
        promises.push(stream.then(makeCounter(counters, 6), makeCounter(counters, 7)));
        stream.addData(DATA2);
        stream.dataDone();
        promises.push(stream.then(makeCounter(counters, 8), makeCounter(counters, 9)));
        // Verify that the stream was fulfilled with the expected data.
        Promise.all(promises).then(function (value) {
            expect(value).toEqual(makeArray(5, DATA1.concat(DATA2)));
            return null;
        }).catch(function (reason) {
            fail(reason);
            return null;
        });
        // Verify that all of the stream fulfillment callbacks were called once
        // and only once and that none of the stream rejection callbacks were
        // called. Use a timeout to allow any possible fulfillment and
        // rejection to be triggered before the verification.
        setTimeout(function () {
            expect(counters).toEqual([1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
            done();
        }, 10);
    });


    it("can be rejected with an error", function (done) {
        var stream = new DataStream(),
            error = new Error("Sample error"),
            counters = [0, 0, 0, 0, 0, 0],
            promises = [];
        // Report an error in the middle of feeding data to the stream, setting
        // up callback counters before, during, and after this process.
        promises.push(stream.then(makeCounter(counters, 0), makeCounter(counters, 1)));
        stream.addData(DATA1);
        promises.push(stream.then(makeCounter(counters, 2), makeCounter(counters, 3)));
        stream.dataError(error);
        promises.push(stream.then(makeCounter(counters, 4), makeCounter(counters, 5)));
        // Verify that the stream was rejected with the expected error. Note
        // that although the stream was rejected, the promises resulting from
        // setting up its rejection callbacks will be fulfilled and not rejected
        // because these callbacks convert rejections to fulfillments.
        Promise.all(promises).then(function (value) {
            expect(value).toEqual([error, error, error]);
            return null;
        }).catch(function (reason) {
            fail(reason);
            return null;
        });
        // Verify that none of the stream fulfillment callbacks were called and
        // that all of the stream rejection callbacks were called once and only
        // once. Use a timeout to allow any possible fulfillment and rejection
        // to be triggered before the verification.
        setTimeout(function () {
            expect(counters).toEqual([0, 1, 0, 1, 0, 1]);
            done();
        }, 10);
    });

    it("can have its rejection handled with a catch()", function (done) {
        var streams = [new DataStream(), new DataStream()],
            errors = [new Error("Sample error 1"), new Error("Sample error 2")],
            counters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            promises = [];
        // Report an error in the middle of feeding data to a stream, setting
        // up callback counters using both then() and catch() before, during,
        // and after this process.
        promises.push(streams[0].then(makeCounter(counters, 0), makeCounter(counters, 1)));
        promises.push(streams[0].catch(makeCounter(counters, 2)));
        streams[0].addData(DATA1);
        promises.push(streams[0].then(makeCounter(counters, 3), makeCounter(counters, 4)));
        promises.push(streams[0].catch(makeCounter(counters, 5)));
        streams[0].dataError(errors[0]);
        promises.push(streams[0].then(makeCounter(counters, 6), makeCounter(counters, 7)));
        promises.push(streams[0].catch(makeCounter(counters, 8)));
        // Report an error in the middle of feeding data to another stream,
        // setting up callback counters using catch() only before, during, and
        // after this process.
        promises.push(streams[1].catch(makeCounter(counters, 9)));
        streams[1].addData(DATA1);
        promises.push(streams[1].catch(makeCounter(counters, 10)));
        streams[1].dataError(errors[1]);
        promises.push(streams[1].catch(makeCounter(counters, 11)));
        // Verify that the stream was rejected with the expected error. Note
        // that although the stream was rejected, the promises resulting from
        // setting up its rejection callbacks will be fulfilled and not rejected
        // because these callbacks convert rejections to fulfillments.
        Promise.all(promises).then(function (value) {
            expect(value).toEqual(makeArray(6, errors[0]).concat(makeArray(3, errors[1])));
            return null;
        }).catch(function (reason) {
            fail(reason);
            return null;
        });
        // Verify that none of the stream fulfillment callbacks were called and
        // that all of the stream rejection callbacks were called once and only
        // once. Use a timeout to allow any possible fulfillment and rejection
        // to be triggered before the verification.
        setTimeout(function () {
            expect(counters).toEqual([0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1]);
            done();
        }, 10);
    });

    it("can have its rejection handling deferred", function (done) {
        var streams = [new DataStream(), new DataStream()],
            errors = [new Error("Sample error 1"), new Error("Sample error 2")],
            counters = [0, 0, 0, 0],
            promises = [];
        // Report an error in the middle of feeding data to two streams, without
        // setting up any callbacks beforehand. streams[0] will have both then()
        // and catch() callbacks, stream[1] will only have catch() callbacks.
        streams[0].addData(DATA1);
        streams[0].dataError(errors[0]);
        streams[1].addData(DATA1);
        streams[1].dataError(errors[1]);
        // Verify that the stream was rejected with the expected error, but
        // defer setting up the callback counters used for the verification,
        // and defer the verification itself, using timeouts.
        setTimeout(function () {
            promises.push(streams[0].then(makeCounter(counters, 0), makeCounter(counters, 1)));
            promises.push(streams[0].catch(makeCounter(counters, 2)));
            promises.push(streams[1].catch(makeCounter(counters, 3)));
            Promise.all(promises).then(function (value) {
                expect(value).toEqual([errors[0], errors[0], errors[1]]);
                return null;
            }).catch(function (reason) {
                fail(reason);
                return null;
            });
            setTimeout(function () {
                expect(counters).toEqual([0, 1, 1, 1]);
                done();
            }, 10);
        }, 10);
    });

    it("can't be rejected more than once", function (done) {
        var stream = new DataStream(),
            counters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            promises = [],
            errors = [new Error("Sample error 1"), new Error("Sample error 2")];
        // Attempt to trigger the promise rejection and fulfillment multiple
        // times, setting up callback counters before and after each attempt.
        promises.push(stream.then(makeCounter(counters, 0), makeCounter(counters, 1)));
        stream.dataError(errors[0]);
        promises.push(stream.then(makeCounter(counters, 2), makeCounter(counters, 3)));
        stream.dataDone();
        promises.push(stream.then(makeCounter(counters, 4), makeCounter(counters, 5)));
        stream.addData(DATA1);
        stream.dataDone();
        promises.push(stream.then(makeCounter(counters, 6), makeCounter(counters, 7)));
        stream.addData(DATA2);
        stream.dataError(errors[1]);
        promises.push(stream.then(makeCounter(counters, 8), makeCounter(counters, 9)));
        // Verify that the promise was rejected with the expected error. Note
        // that although the stream promise was rejected, the promises resulting
        // from setting up the rejection callbacks will be fulfilled and not
        // rejected because these callbacks convert rejections to fulfillments.
        Promise.all(promises).then(function (value) {
            expect(value).toEqual(makeArray(5, errors[0]));
            return null;
        }).catch(function (reason) {
            fail(reason);
            return null;
        });
        // Verify that none of the promise fulfillment callbacks were called
        // and that all of the promise rejection callbacks were called once and
        // only once. Use a timeout to allow all the possible fulfillments and
        // rejections to be triggered before the verification.
        setTimeout(function () {
            expect(counters).toEqual([0, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
            done();
        }, 10);
    });

});
