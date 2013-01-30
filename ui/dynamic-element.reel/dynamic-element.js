/**
    @module "montage/ui/dynamic-element.reel"
    @requires montage
    @requires montage/ui/component
    @requires collections/set
*/
var Montage = require("montage").Montage;
var Component = require("ui/component").Component;
var Set = require("collections/set");

// TODO replace all usage of undefinedGet and undefinedSet with manipulation of
// a classList Set() from Collections and handle rangeChange events to sync
// the document in the next draw

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



    _range: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            var range = document.createRange(),
                className = this.element.className;
            range.selectNodeContents(this.element);
            this._range = range;
            // classList
            if (className.length !== 0) {
                this.classList.addEach(className.split(" "));
            }
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
            this._drawClassListIntoComponent();
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
        example to toggle the complete class: "classList.has('complete')" : { "<-" : "@owner.isCompete"}
        @type {Property}
        @default null
    */
    classList: {
        get: function() {
            if (this._classList === null) {
                this._classList = new Set();
                this._classList.addRangeChangeListener(this, "classList");
            }
            return this._classList;
        }
    },

    handleClassListRangeChange: {
        value: function (name) {
            console.log("handleClassListRangeChange" , name);
            this._classListDirty = true;
            this.needsDraw = true;
        }
    },

    _drawClassListIntoComponent: {
        value: function() {
            if (this._classListDirty) {
                var elementClassList = this.element.classList,
                    classList = this._classList;

                Array.prototype.forEach.call(elementClassList, function(cssClass) {
                    if (! classList.has(cssClass)) {
                        elementClassList.remove(cssClass);
                    }
                });
                this._classList.forEach(function(cssClass) {
                    elementClassList.add(cssClass);
                });
                this._classListDirty = false;
            }
        }
    }
});