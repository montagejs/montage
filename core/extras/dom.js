/*global Node,Element, */

/**
 * @module montage/core/dom
 * @requires montage/core/geometry/point
*/


// Extend Node.prototype
if (typeof Node !== "undefined") {

    var NodePrototype = Node.prototype;

    NodePrototype.get = function (key) {
        return this.getAttribute(key) || this[key];
    };

    NodePrototype.parentOf = function (child) {
        while ((child = child.parentNode) && child !== this) {}
        //If child is defined then we didn't walk all the way up to the root
        return child ? true : false;
    };
}


// Extend Element.prototype
if (typeof Element !== "undefined") {

var ElementPrototype = Element.prototype;

    /**
     * @function external:Element#set
     * @param {string} string
     * @param {string} string
     * @param {number} string
     */
    Object.defineProperty(ElementPrototype, "set", {
        value: function (aPropertyPath, value, currentIndex) {
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

    var classListProp = "classList";
    
    /**
     * @function external:Element#set
     * classList.js
     *
     * Implements a cross-browser element.classList getter.
     */
    if (!ElementPrototype.hasOwnProperty(classListProp)) {
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
            Object.defineProperty(ElementPrototype, classListProp, { get: classListGetter, enumerable: true });
        } else if (Object.prototype.__defineGetter__) {
            ElementPrototype.__defineGetter__(classListProp, classListGetter);
        }
    }
}


// Extend Node.prototype
if (typeof Node !== "undefined") {

    var DocumentPrototype = Object.getPrototypeOf(document);

    DocumentPrototype.addRule = function (selectorText, definition) {
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

    DocumentPrototype.getRule = function (ruleKey, styleSheet) {
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
}