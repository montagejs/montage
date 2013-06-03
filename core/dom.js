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
/*global Node,Element,WebKitPoint,webkitConvertPointFromNodeToPage,webkitConvertPointFromPageToNode */
/**
    Provides DOM
    @module montage/core/dom
    @requires montage/core/geometry/point
*/

var Point = require("core/geometry/point").Point,
    NodePrototype = Node.prototype,
    ElementPrototype = Element.prototype;

/**
    @function external:Element#set
    @param {string} string
    @param {string} string
    @param {number} string
*/
Object.defineProperty(ElementPrototype, "set", {
    value: function(aPropertyPath, value, currentIndex) {
        var dotIndex = aPropertyPath.indexOf(".", currentIndex),
            result,
            currentKeyComponent,
            indexEnd,
            styleKey,
            classKey;

        currentIndex = currentIndex || 0;

        currentKeyComponent = aPropertyPath.substring(currentIndex, (dotIndex === -1 ? aPropertyPath.length : dotIndex));

        if (dotIndex === -1) {
            //This is only using properties.
            this.setAttribute(currentKeyComponent, value);
        }
        else {
            indexEnd = aPropertyPath.lastIndexOf(".");
            if (currentKeyComponent === "style") {
                styleKey = aPropertyPath.substring(dotIndex + 1, aPropertyPath.length);
                this.style[styleKey] = value;
            } else if (currentKeyComponent === "classList") {
                classKey = aPropertyPath.substring(dotIndex + 1, aPropertyPath.length);
                if (value) {
                    this.classList.add(classKey);
                } else {
                    this.classList.remove(classKey);
                }
            }

            else if ((result = this.get(aPropertyPath.substring(0, indexEnd)))) {
                (result[aPropertyPath.substring(indexEnd + 1, aPropertyPath.length)] = value);
            }
        }

    },
    enumerable: false
});

NodePrototype.get = function(key) {
    return this.getAttribute(key) || this[key];
};

Object.getPrototypeOf(document).addRule = function(selectorText, definition) {
    var styleSheet, cssRule;
    if ((styleSheet = document.styleSheets[0]) == null) {
        var style = document.createElement("style");
        style.type = "text/css";
        document.head.appendChild(style);
        styleSheet = document.styleSheets[0];
    } else {
        cssRule = document.getRule(selectorText, styleSheet);
    }
    if (!cssRule) {
        styleSheet.insertRule(selectorText + " " + definition, styleSheet.cssRules.length);
    }
};

Object.getPrototypeOf(document).getRule = function(ruleKey, styleSheet) {
    var cssRule;
    if (styleSheet.cssRules) {
        for (var j = 0; (cssRule = styleSheet.cssRules[j]); j++) {
            if (cssRule.name && cssRule.name === ruleKey) {
                // keyframe animation
                return cssRule;
            } else if (cssRule.selectorText === ruleKey) {
                return cssRule;
            }
        }
    }
};

/*
 * classList.js
 *
 * Implements a cross-browser element.classList getter.
 * By Eli Grey, http://eligrey.com
 */

"use strict";

if (typeof Element !== "undefined") {

    (function () {

        var classListProp = "classList";

        if (!Element.prototype.hasOwnProperty(classListProp)) {
            var trim = /^\s+|\s+$/g,
                setClasses = function (elem, classes) {
                    elem.setAttribute("class", classes.join(" "));
                },
                checkAndGetIndex = function (classes, token) {
                    if (token === "") {
                        throw "SYNTAX_ERR";
                    }
                    if (/\s/.test(token)) {
                        throw "INVALID_CHARACTER_ERR";
                    }

                    return classes.indexOf(token);
                },
                classListGetter = function () {
                    var elem = this,
                        classes = elem.getAttribute("class") || "";
                        classes = classes.replace(trim, "").split(/\s+/);
                    return {
                        length: classes.length,
                        item: function (i) {
                            return classes[i] || null;
                        },
                        contains: function (token) {
                            return checkAndGetIndex(classes, token) !== -1;
                        },
                        add: function (token) {
                            if (checkAndGetIndex(classes, token) === -1) {
                                classes.push(token);
                                this.length = classes.length;
                                setClasses(elem, classes);
                            }
                        },
                        remove: function (token) {
                            var index = checkAndGetIndex(classes, token);
                            if (index !== -1) {
                                classes.splice(index, 1);
                                this.length = classes.length;
                                setClasses(elem, classes);
                            }
                        },
                        toggle: function (token) {
                            if (checkAndGetIndex(classes, token) === -1) {
                                this.add(token);
                            } else {
                                this.remove(token);
                            }
                        },
                        toString: function () {
                            return (elem.getAttribute("class") || "");
                        }
                    };
                };

            if (Object.defineProperty) {
                Object.defineProperty(Element.prototype, classListProp, { get: classListGetter, enumerable: true });
            } else if (Object.prototype.__defineGetter__) {
                Element.prototype.__defineGetter__(classListProp, classListGetter);
            }
        }

    }());

}

NodePrototype.parentOf = function(child) {
    while ((child = child.parentNode) && child !== this) {};
    //If child is defined then we didn't walk all the way up to the root
    return child ? true : false;

};

var _offsetForElement = function(element) {
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
try {
    _webKitPoint = new WebKitPoint(0,0);
} catch (e) {}

var webkitImplementation = function() {
    exports.convertPointFromNodeToPage = function(element, point) {
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

    exports.convertPointFromPageToNode = function(element, point) {
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
var shimImplementation = function() {
    exports.convertPointFromNodeToPage = function(element, point) {
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

    exports.convertPointFromPageToNode = function(element, point) {
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

if (_webKitPoint) {
    webkitImplementation();
} else {
    shimImplementation();
}
