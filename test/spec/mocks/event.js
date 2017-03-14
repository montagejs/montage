var Set = require("montage/collections/set");

var MockEvent = exports.MockEvent = function MockEvent() {};

exports.event = function (type, canBubble, cancelable, detail) {
    var event = document.createEvent("CustomEvent");

    type = type || "mockEvent";
    canBubble = canBubble || true;
    cancelable = cancelable || true;
    detail = detail || null;
    event.initCustomEvent(type, canBubble, cancelable, detail);

    return fromEvent(event);
}

var fromEvent = exports.fromEvent = function (event) {

    var mockEvent = new MockEvent();
    for (var key in event) {
        if (typeof event[key] !== "function") {
            mockEvent[key] = event[key];
        }
    }
    mockEvent.propagationStopped = false;
    mockEvent.stopPropagation = function () {
        mockEvent.propagationStopped = true;
    };
    mockEvent.immediatePropagationStopped = false;
    mockEvent.stopImmediatePropagation = function () {
        mockEvent.immediatePropagationStopped = true;
    };
    mockEvent.defaultPrevented = false;
    mockEvent.preventDefault = function () {
        mockEvent.defaultPrevented = true;
    };
    return mockEvent;
}
