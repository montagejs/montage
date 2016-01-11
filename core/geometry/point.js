/**
 * @module montage/core/geometry/point
 * @requires montage/core/core
 */
var Montage = require("../core").Montage;

/**
 * @class Point
 * @extends Montage
 */

var Point = exports.Point = Montage.specialize( /** @lends Point# */ {
    init: {
        enumerable: false,
        value: function (x, y) {
            this.x = x === null ? 0 : x;
            this.y = y === null ? 0 : y;
            return this;
        }
    },

    /**
     * The x axis point.
     * @type {number}
     * @default  0
     */
    x: {
        enumerable: true,
        value: 0
    },

    /**
     * The y axis point.
     * @type {number}
     * @default  0
     */
    y: {
        enumerable: true,
        value: 0
    }

}, {

    /**
     * Interpolates between two points.
     * @function
     * @param {Axis} percent The interpolation percentage.
     * @param {Axis} point0 The 0 interpolation point.
     * @param {Axis} point1 The 1 interpolation point.
     * @param {Axis} precision The interpolation precision.
     * @returns new Point().init(xValue, yValue)
     */
    interpolate: {
        enumerable: false,
        value: function (percent, point0, point1, precision) {
            var xValue,
                yValue;
            xValue = point0.x + (point1.x - point0.x) * percent;
            yValue = point0.y + (point1.y - point0.y) * percent;
            if (precision > 0) {
                xValue = Math.round(xValue * precision) / precision;
                yValue = Math.round(yValue * precision) / precision;
            }
            return new exports.Point().init(xValue, yValue);
        }
    }

});


var _offsetForElement = function (element) {
    var boundingClientRect,
        elementsDocument = element.ownerDocument,
        elementsDocumentElement,
        elementsBody,
        elementsWindow;

    if ( element && elementsDocument ) {
        elementsDocumentElement = elementsDocument.documentElement;
        elementsBody = elementsDocument.body;
        elementsWindow = elementsDocument.defaultView;

        if ( element !== elementsBody ) {
            boundingClientRect = element.getBoundingClientRect();
            if ( elementsDocumentElement.parentOf(element) ) {
                var clientTop  = elementsDocumentElement.clientTop  || elementsBody.clientTop  || 0,
                    clientLeft = elementsDocumentElement.clientLeft || elementsBody.clientLeft || 0,
                    scrollTop  = elementsWindow.pageYOffset || elementsDocumentElement.scrollTop  || elementsBody.scrollTop,
                    scrollLeft = elementsWindow.pageXOffset || elementsDocumentElement.scrollLeft || elementsBody.scrollLeft,
                    top  = boundingClientRect.top  + scrollTop  - clientTop,
                    left = boundingClientRect.left + scrollLeft - clientLeft;
                return { top: top, left: left };
            } else {
                return { top: boundingClientRect.top, left: boundingClientRect.left };
            }

        } else {
            return { top: elementsBody.offsetTop, left: elementsBody.offsetLeft };
        }
    } else {
        return null;
    }
};

var _webKitPoint = null;

var webkitImplementation = function () {
    Point.convertPointFromNodeToPage = function (element, point) {
        if(point) {
            _webKitPoint.x = point.x;
            _webKitPoint.y = point.y;
        } else {
            _webKitPoint.x = 0;
            _webKitPoint.y = 0;
        }
        point = webkitConvertPointFromNodeToPage(element, _webKitPoint);
        return point ? new Point().init(point.x, point.y) : null;
    };

    Point.convertPointFromPageToNode = function (element, point) {
        if(point) {
            _webKitPoint.x = point.x;
            _webKitPoint.y = point.y;
        } else {
            _webKitPoint.x = 0;
            _webKitPoint.y = 0;
        }
        point = webkitConvertPointFromPageToNode(element, _webKitPoint);
        return point ? new Point().init(point.x, point.y) : null;
    };
};

var shimImplementation = function () {
    Point.convertPointFromNodeToPage = function (element, point) {
        if (!element || typeof element.x !== "undefined") {
            return null;
        }
        var offset;
        if (offset =_offsetForElement(element)) {
            return new Point().init((point ? point.x:0)+offset.left, (point ? point.y:0)+offset.top);
        } else {
            return new Point().init((point ? point.x:0), (point ? point.y:0));
        }
    };

    Point.convertPointFromPageToNode = function (element, point) {
        if (!element || typeof element.x !== "undefined") {
            return null;
        }
        var offset;
        if (offset =_offsetForElement(element)) {
            return new Point().init((point ? point.x:0)-offset.left, (point ? point.y:0)-offset.top);
        } else {
            return new Point().init((point ? point.x:0), (point ? point.y:0));
        }
    };
};

if (typeof WebKitPoint !== "undefined") {
    _webKitPoint = new WebKitPoint(0,0);
    webkitImplementation();
} else {
    shimImplementation();
}
