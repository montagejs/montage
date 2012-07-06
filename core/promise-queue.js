/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
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
                head: rejection || Promise.reject(reason, error)
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

