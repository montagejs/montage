
var PropertyChanges = require("collections/listen/property-changes");

// for whatever reason, HTMLInputElement is not the same as the global of the
// same name, at least in Chrome

function changeChecked(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "checked", event.target.checked);
}

function changeValue(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "value", event.target.value);
}

function makeObservable(key) {
    if (key === "checked") {
        this.addEventListener("change", changeChecked);
    } else if (key === "value") {
        this.addEventListener("change", changeValue);
        if (this.type === "text" || this.nodeName === "TEXTAREA") {
            this.addEventListener("keyup", changeValue);
        }
    }
}

function makeUnobservable(key) {
    if (key === "checked") {
        this.removeEventListener("change", changeChecked);
    } else if (key === "value") {
        this.removeEventListener("change", changeValue);
        if (this.type === "text" || this.nodeName === "TEXTAREA") {
            this.removeEventListener("keyup", changeValue);
        }
    }
}

var HTMLInputElement = Object.getPrototypeOf(document.createElement("input"));
HTMLInputElement.makePropertyObservable = makeObservable;
HTMLInputElement.makePropertyUnobservable = makeUnobservable;

var HTMLTextAreaElement = Object.getPrototypeOf(document.createElement("textarea"));
HTMLTextAreaElement.makePropertyObservable = makeObservable;
HTMLTextAreaElement.makePropertyUnobservable = makeUnobservable;

// TODO make window.history state observable

