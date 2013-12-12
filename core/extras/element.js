// Element.isElement is used by the event manager
if (Element && !Element.isElement) {
    Object.defineProperty(Element, "isElement", {
        value: function (obj) {
            return !!(obj && 1 === obj.nodeType);
        },
        writable: true,
        configurable: true
    });
}
