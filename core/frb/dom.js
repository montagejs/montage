
var PropertyChanges = require("collections/listen/property-changes");

// for whatever reason, HTMLInputElement is not the same as the global of the
// same name, at least in Chrome

function changeChecked(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "checked", event.target.checked);
}

function changeValue(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "value", event.target.value);
}

function changeInnerHTML(event) {
    PropertyChanges.dispatchOwnPropertyChange(event.target, "innerHTML", event.target.innerHTML);
    PropertyChanges.dispatchOwnPropertyChange(event.target, "innerText", event.target.innerText);
    PropertyChanges.dispatchOwnPropertyChange(event.target, "value", event.target.innerText);
}

function makeObservable(key) {
    if (key === "checked") {
        this.addEventListener("change", changeChecked);
    } else if (key === "value") {
        this.addEventListener("change", changeValue);
        if (this.type === "text" || this.nodeName === "TEXTAREA") {
            this.addEventListener("keyup", changeValue);
        } else if (this.contentEditable) {
            this.innerText = this.innerText ? this.innerText : this.value;
            this.addEventListener("keyup", changeInnerHTML);
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
        } else if (this.contentEditable) {
            this.removeEventListener("keyup", changeInnerHTML);
        }
    }
}

var HTMLInputElement = Object.getPrototypeOf(document.createElement("input"));
HTMLInputElement.makePropertyObservable = makeObservable;
HTMLInputElement.makePropertyUnobservable = makeUnobservable;

var HTMLTextAreaElement = Object.getPrototypeOf(document.createElement("textarea"));
HTMLTextAreaElement.makePropertyObservable = makeObservable;
HTMLTextAreaElement.makePropertyUnobservable = makeUnobservable;

var HTMLSpanElement = Object.getPrototypeOf(document.createElement("span"));
HTMLSpanElement.makePropertyObservable = makeObservable;
HTMLSpanElement.makePropertyUnobservable = makeUnobservable;

// TODO make window.history state observable

