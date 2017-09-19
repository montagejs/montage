
if (typeof Element !== "undefined" && !Element.isElement) {
    Object.defineProperty(Element, "isElement", {
        value: function (obj) {
            return !!(obj && 1 === obj.nodeType);
        },
        writable: true,
        configurable: true
    });

    Object.defineProperty(Element.prototype, "nativeSetAttribute", {
        value: Element.prototype.setAttribute,
        writable: true,
        configurable: true
    });
}
