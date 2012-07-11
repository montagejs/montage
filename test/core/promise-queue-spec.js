/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

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

