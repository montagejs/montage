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
var Montage = require("montage").Montage;
var MutableEvent = require("montage/core/event/mutable-event").MutableEvent;
var Target = require("montage/core/target").Target;

describe("events/mutable-event-spec", function () {

    describe("custom events using fromType", function () {

        var type, target, listener, event;

        beforeEach(function () {
            type = "myCustomEventType";
            listener = {};
            target = new Target();

            target.addEventListener(type, listener);
        });

        afterEach(function () {
            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEvent(event);
            expect(listener.handleEvent).toHaveBeenCalledWith(event);
        });

        it("should preserve target upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.target).toBe(target);
            }

            event = MutableEvent.fromType(type);
        });

        it("should preserve type upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.type).toBe(type);
            }

            event = MutableEvent.fromType(type);
        });

        it("should preserve custom properties upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.foo).toBe("foo in properties");
            }

            event = MutableEvent.fromType(type);
            event.foo = "foo in properties";
        });

        it("should preserve detail upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.detail.foo).toBe("foo in detail");
            }

            event = MutableEvent.fromType(type, false, false, {
                foo: "foo in detail"
            });
        });

        it("should preserve truthy canBubble upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.canBubble).toBeTruthy;
            }

            event = MutableEvent.fromType(type, true);
        });

        it("should preserve falsy canBubble upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.canBubble).toBeFalsy;
            }

            event = MutableEvent.fromType(type, false);
        });

        it("should preserve truthy cancelability upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.cancelable).toBeTruthy;
            }

            event = MutableEvent.fromType(type, false, true);
        });

        it("should preserve falsy cancelability upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.cancelable).toBeFalsy;
            }

            event = MutableEvent.fromType(type, false, false);
        });
    });

    describe("custom events using dispatchEventNamed", function () {

        var type, target, listener, event;

        beforeEach(function () {
            type = "myCustomEventType";
            listener = {};
            target = new Target();

            target.addEventListener(type, listener);
        });

        afterEach(function () {
            expect(listener.handleEvent).toHaveBeenCalled();
        });

        it("should preserve target upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.target).toBe(target);
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type);
        });

        it("should preserve type upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.type).toBe(type);
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type);
        });

        it("should preserve detail upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.detail.foo).toBe("foo in detail");
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false, false, {
                foo: "foo in detail"
            });
        });

        it("should preserve truthy canBubble upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.canBubble).toBeTruthy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, true);
        });

        it("should preserve falsy canBubble upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.canBubble).toBeFalsy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false);
        });

        it("should preserve truthy cancelability upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.cancelable).toBeTruthy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false, true);
        });

        it("should preserve falsy cancelability upon dispatching", function () {
            listener.handleEvent = function (evt) {
                expect(evt.cancelable).toBeFalsy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false, false);
        });

    });



    describe("methods", function () {
        var event;
        beforeEach(function () {
            event = MutableEvent.fromType("mousedown");
        });
        it("getPreventDefault() shouldn't throw", function () {
            expect(function () {
                event.getPreventDefault();
            }).not.toThrow();
        });
    });


});
