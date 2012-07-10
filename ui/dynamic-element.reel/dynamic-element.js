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
/**
    @module "montage/ui/dynamic-element.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    The DynamicElement is a general purpose component that aims to expose all the properties of the element as a component.
    @class module:"montage/ui/dynamic-element.reel".DynamicElement
    @extends module:montage/ui/component.Component
*/
exports.DynamicElement = Montage.create(Component, /** @lends module:"montage/ui/dynamic-element.reel".DynamicElement# */ {

    hasTemplate: {
        value: false
    },

    _innerHTML: {
        value: null
    },

    _usingInnerHTML: {
        value: null
    },

    /**
        The innerHTML displayed as the content of the DynamicElement
        @type {Property}
        @default null
    */
    innerHTML: {
        get: function() {
            return this._innerHTML;
        },
        set: function(value) {
            this._usingInnerHTML = true;
            if (this._innerHTML !== value) {
                this._innerHTML = value;
                this.needsDraw = true;
            }
        }
    },

    /**
        The default html displayed if innerHTML is falsy.
        @type {Property}
        @default {String} ""
    */
    defaultHTML: {
        value: ""
    },

    _allowedTagNames: {
        value: null
    },

    /**
        White list of allowed tags in the innerHTML
        @type {Property}
        @default null
    */
    allowedTagNames: {
        get: function() {
            return this._allowedTagNames;
        },
        set: function(value) {
            if (this._allowedTagNames !== value) {
                this._allowedTagNames = value;
                this.needsDraw = true;
            }
        }
    },


    _classList: {
        value: null
    },

    _classListDirty: {
        value: false
    },

    /**
        The classList of the component's element, the purpose is to mimic the element's API but to also respect the draw.
        It can also be bound to by binding each class as a property.
        example to toggle the complete class: "classList.complete" : { "<-" : "@owner.isCompete"}
        @type {Property}
        @default null
    */
    classList: {
        get: function() {
            if (this._classList === null) {
                var className = this.element.className;
                this._classList = ClassList.newWithComponent(this, (className.length !== 0 ? this.element.className.split(" ") : null));
            }
            return this._classList;
        }
    },


    _range: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            var range = document.createRange();
            range.selectNodeContents(this.element);
            this._range = range;
        }
    },

    _contentNode: {
        value: null
    },

    draw: {
        value: function() {
            // get correct value
            var displayValue = (this.innerHTML || 0 === this.innerHTML ) ? this.innerHTML : this.defaultHTML,
                content, allowedTagNames = this.allowedTagNames, range = this._range, elements;

            //push to DOM
            if(this._usingInnerHTML) {
                if (allowedTagNames !== null) {
                    //cleanup
                    this._contentNode = null;
                    range.deleteContents();
                    //test for tag white list
                    content = range.createContextualFragment( displayValue );
                    if(allowedTagNames.length !== 0) {
                        elements = content.querySelectorAll("*:not(" + allowedTagNames.join("):not(") + ")");
                    } else {
                        elements = content.childNodes;
                    }
                    if (elements.length === 0) {
                        range.insertNode(content);
                        if(range.endOffset === 0) {
                            // according to https://bugzilla.mozilla.org/show_bug.cgi?id=253609 Firefox keeps a collapsed
                            // range collapsed after insertNode
                            range.selectNodeContents(this.element);
                        }

                    } else {
                        console.warn("Some Elements Not Allowed " , elements);
                    }
                } else {
                    content = this._contentNode;
                    if(content === null) {
                        //cleanup
                        range.deleteContents();
                        this._contentNode = content = document.createTextNode(displayValue);
                        range.insertNode(content);
                        if(range.endOffset === 0) {
                            // according to https://bugzilla.mozilla.org/show_bug.cgi?id=253609 Firefox keeps a collapsed
                            // range collapsed after insert
                            range.selectNodeContents(this.element);
                        }

                    } else {
                        content.data = displayValue;
                    }
                }
            }
            // classList
            if (this._classListDirty) {
                this.classList.drawIntoComponent();
                this._classListDirty = false;
            }
        }
    }

});

var ClassList = Montage.create(Montage, {

    newWithComponent: {
        value: function(component, classes) {
            var aClassList = ClassList.create(),
                aClass, i = 0;
            aClassList._component = component;
            aClassList._classes = {};
            if (classes !== null) {
                while (aClass =  classes[i++]) {
                    aClassList.add(aClass);
                }
            }

            return aClassList;
        }
    },

    __dirty__: {
        value: false
    },

    _component: {
        value: null
    },

    _classes: {
        value: null
    },

    _installCssClass: {
        value: function(key) {
            this._classes[key] = false;
            Montage.defineProperty(this, key, {
                get: function() {
                    return this._classes[key];
                },
                set: function(value) {
                    value = !!value;
                    if(value !== this._classes[key]) {
                        this._classes[key] = value;
                        this._component._classListDirty = true;
                        this._component.needsDraw = true;
                    }
                }
            });
        }
    },

    add: {
        value: function(key) {
            this.undefinedSet(key, true);
        }
    },

    remove: {
        value: function(key) {
            this.undefinedSet(key, false);
        }
    },

    toggle: {
        value: function(key) {
            this.undefinedSet(key, !this.undefinedGet(key));
        }
    },

    contains: {
        value: function(key) {
            return !!this._classes[key];
        }
    },

    undefinedGet: {
        value: function(key) {
            if (typeof this[key] === "undefined") {
                this._installCssClass(key);
            }
            return this[key];
        }
    },

    undefinedSet: {
        value: function(key, value) {
            if (typeof this[key] === "undefined") {
                this._installCssClass(key);
            }
            this[key] = value;
        }
    },

    drawIntoComponent: {
        value: function() {
            var classes = this._classes,
                classList = this._component.element.classList,
                cssClass;
            for (cssClass in classes) {
                if (classes.hasOwnProperty(cssClass)) {
                    if(classes[cssClass]) {
                        classList.add(cssClass);
                    } else {
                        classList.remove(cssClass);
                    }
                }
            }

        }
    }

});
