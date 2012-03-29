
var Montage = require("./core").Montage;
var Promise = require("./promise").Promise;

exports.PromiseQueue = Montage.create(Montage, {
    init: {
        value: function () {
            this._ends = Promise.defer();
            this._closed = Promise.defer();
            this.closed = this._closed.promise;
            return this;
        }
    },
    put: {
        value: function (value) {
            var next = Promise.defer();
            this._ends.resolve({
                head: value,
                tail: next.promise
            });
            this._ends.resolve = function (resolution) {
                next.resolve(resolution);
            };
        }
    },
    get: {
        value: function () {
            var ends = this._ends;
            var result = ends.promise.get("head");
            this._ends = {
                resolve: function (resolution) {
                    ends.resolve(resolution);
                },
                promise: ends.promise.get("tail")
            };
            return result.fail(function (reason, error, rejection) {
                this._closed.resolve();
                return rejection;
            });
        }
    },
    close: {
        value: function (reason, error, rejection) {
            var end = {
                head: rejections || Promise.reject(reason, error)
            };
            end.tail = end;
            this._ends.resolve(end);
            return this._closed.promise;
        }
    },
    forEach: {
        value: function (put, thisp) {
            var queue = this;
            function loop() {
                return queue.get().then(function (value) {
                    put.call(thisp, value);
                })
                .then(loop);
            }
            return loop();
        }
    }
});

