/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var MutableEvent = require("montage/core/event/mutable-event").MutableEvent;

describe("events/mutable-event-spec", function() {

    describe("custom events using fromType", function() {

        var type, target, listener, event;

        beforeEach(function() {
            type = "myCustomEventType";
            listener = {};
            target = {};

            target.addEventListener(type, listener);
        });

        afterEach(function() {
            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEvent(event);
            expect(listener.handleEvent).toHaveBeenCalledWith(event);
        });

        it("should preserve target upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.target).toBe(target);
            }

            event = MutableEvent.fromType(type);
        });

        it("should preserve type upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.type).toBe(type);
            }

            event = MutableEvent.fromType(type);
        });

        it("should preserve custom properties upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.foo).toBe("foo in properties");
            }

            event = MutableEvent.fromType(type);
            event.foo = "foo in properties";
        });

        it("should preserve detail upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.detail.foo).toBe("foo in detail");
            }

            event = MutableEvent.fromType(type, false, false, {
                foo: "foo in detail"
            });
        });

        it("should preserve truthy canBubble upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.canBubble).toBeTruthy;
            }

            event = MutableEvent.fromType(type, true);
        });

        it("should preserve falsy canBubble upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.canBubble).toBeFalsy;
            }

            event = MutableEvent.fromType(type, false);
        });

        it("should preserve truthy cancelability upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.cancelable).toBeTruthy;
            }

            event = MutableEvent.fromType(type, false, true);
        });

        it("should preserve falsy cancelability upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.cancelable).toBeFalsy;
            }

            event = MutableEvent.fromType(type, false, false);
        });
    });

    describe("custom events using dispatchEventNamed", function() {

        var type, target, listener, event;

        beforeEach(function() {
            type = "myCustomEventType";
            listener = {};
            target = {};

            target.addEventListener(type, listener);
        });

        afterEach(function() {
            expect(listener.handleEvent).toHaveBeenCalled();
        });

        it("should preserve target upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.target).toBe(target);
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type);
        });

        it("should preserve type upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.type).toBe(type);
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type);
        });

        it("should preserve detail upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.detail.foo).toBe("foo in detail");
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false, false, {
                foo: "foo in detail"
            });
        });

        it("should preserve truthy canBubble upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.canBubble).toBeTruthy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, true);
        });

        it("should preserve falsy canBubble upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.canBubble).toBeFalsy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false);
        });

        it("should preserve truthy cancelability upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.cancelable).toBeTruthy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false, true);
        });

        it("should preserve falsy cancelability upon dispatching", function() {
            listener.handleEvent = function(evt) {
                expect(evt.cancelable).toBeFalsy;
            }

            spyOn(listener, "handleEvent").andCallThrough();
            target.dispatchEventNamed(type, false, false);
        });

    })

});
