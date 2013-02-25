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
    @module "montage/ui/native/select.reel"
    @requires montage/ui/component
    @requires montage/ui/controller/array-controller
    @requires montage/ui/native-control
    @requires montage/ui/composer/press-composer
*/

var Montage = require("montage").Montage,
    Bindings = require("core/bindings").Bindings,
    RangeController = require("core/range-controller").RangeController,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl,
    PressComposer = require("ui/composer/press-composer").PressComposer,
    Map = require("collections/map");

/**
    Wraps the a &lt;select&gt; element with binding support for the element's
    standard attributes. Uses an ArrayController instance to manage the
    element's contents and selection.
    @class module:"montage/ui/native/select.reel".Select
    @extends module:montage/ui/native-control.NativeControl
    @summary
    If the &lt;select&gt; markup contains <option> is provided in the markup
    and <code>contentController</code> is not, the
    <code>contentController</code> collection is populated with the options
    from the markup. If <code>contentController</code> is present, any options
    in the markup are overwritten by the values from the
    <code>contentController</code> when they are available.
 */
var Select = exports.Select =  Montage.create(NativeControl, /** @lends module:"montage/ui/native/select.reel".Select */ {

    _fromInput: {value: null},
    _synching: {value: null},
    //_internalSet: {value: null},

    _selectedIndexes: {
        value: null
    },

    selectedIndexes: {
        get: function() {
            return this._selectedIndexes;
        },
        set: function(selectedIndexes) {
            // _selectedIndexes is automatically filled from
            // this.contentController.iterations{selected}
            var iterations = this.contentController.iterations,
                values = [];

            for (var i = 0, ii = selectedIndexes.length; i < ii; i++) {
                values.push(iterations[selectedIndexes[i]].object[this.valuePropertyPath || 'value']);
            }

            // values should be automatically created by a binding
            if (selectedIndexes.length <= 1) {
                this.value = values[0];
            } else {
                this.values = values;
            }
        }
    },

    didCreate: {
        value: function() {
            if (typeof NativeControl.didCreate === "function") {
                NativeControl.didCreate.apply(this);
            }

            this._selectedIndexes = [];
            this._selectedIndexes.addRangeChangeListener(this, "selectedIndexes");
        }
    },

    handleSelectedIndexesRangeChange: {
        value: function() {
            if(this.needsDraw === false) {
                this.needsDraw = this._synching || !this._fromInput;
            }
        }
    },

    _setContentControllerSelectedIndexes: {
        value: function(selectedIndexes) {
            var iterations = this.contentController.iterations;

            for (var i = 0, ii = iterations.length; i < ii; i++) {
                if (selectedIndexes.indexOf(i) === -1) {
                    iterations[i].selected = false;
                } else {
                    iterations[i].selected = true;
                }
            }
        }
    },

    //-----------------------
    // Public API
    //-----------------------

    _content: {value: null, enumerable: false},
/**
    An array of items to to assign to the component's
    <code>contentController</code> property, which is a RangeController.
*/
    content: {
        set: function(value) {
            //if(!Array.isArray(value)) {
            //    value = [value];
            //}
            this._content = value;

            if(!this.contentController) {
                var contentController = RangeController.create();
                contentController.content = value;
                this.contentController = contentController;
            }

            this.needsDraw = true;
        },
        get: function() {
            return this._content;
        }
    },

    // If a <code>contentController</code> is provided, this allows the developer to specify
    // which property in each element provides the "value" part of <option>
    /**
        Specifies the property belonging to the component's <code>contentController</code> to use as the "value" part of the <option>.
    */
    valuePropertyPath: {
        value: null
    },

    /**
        Specifies the property belonging to the component's <code>contentController</code> to use as the text content of the <option>.
    */
    textPropertyPath: {
        value: null
    },


    _contentController: {
        value: null
    },

/**
    An ArrayController instance used to manage the content and selection of the select input control.
    @default null
*/
    contentController: {
        get: function() {
            return this._contentController;
        },
        set: function(value) {
            if (this._contentController === value) {
                return;
            }

            this._contentController = value;

            Bindings.defineBindings(this, {
                "content": {"<-": "_contentController.organizedContent"},
                "_iterations": {"<-": "_contentController.iterations"},
                "_selection": {"<-": "_contentController.selection"},
                "_selectedIndexes.rangeContent()": {
                    "<-": "content.enumerate().filter{$_selection.has(.1)}.map{.0}"
                }
            });
        }
    },

    _getSelectedValuesFromIndexes: {
        value: function() {
            var selection = this._selection;
            var arr = [];
            if(selection && selection.length > 0) {
                var i=0, len = selection.length, valuePath;
                for(; i<len; i++) {
                    valuePath = this.valuePropertyPath || 'value';
                    if(selection[i][valuePath]) {
                        arr.push(selection[i][valuePath]);
                    }
                }
            }
            return arr;

        }
    },

    _synchValues: {
        value: function() {
            if(!this._synching) {
                this._synching = true;
                this.values = this._getSelectedValuesFromIndexes();
                this.value = ((this.values && this.values.length > 0) ? this.values[0] : null);
                this._synching = false;
            }
        }
    },


    // values should be automatically created by
    // iterations.filter{selected}.map{object}.value
    _values: {value: null},
    values: {
        get: function() {
            return this._values;
        },
        set: function(valuesArray) {
            var content = this.contentController ? this.contentController.content : null;

            if(valuesArray && content) {
                this._values = valuesArray;

                if(!this._synching) {
                    var selectedIndexes = [];
                    var i=0, len = this._values.length, index;

                    for(; i<len; i++) {
                        index = this._indexOf(this._values[i]);
                        if(index >= 0) {
                            selectedIndexes.push(index);
                        }
                    }

                    this._synching = true;
                    this._setContentControllerSelectedIndexes(selectedIndexes);
                    //this.contentController.selectedIndexes = selectedIndexes;
                    this._synching = false;
                }
            }
        }
        //dependencies: ["_selectedIndexes"]
    },

    // values should be automatically created by
    // iterations.map{selected}.0.object.value
    _value: {value: null},
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            this._value = value;

            if(!this._synching) {
                if(value == null) {
                    this.values = [];
                } else {
                    this.values = [value];
                }
            }


        }
        //dependencies: ["_selectedIndexes"]
    },

    // HTMLSelectElement methods

    // add() and remove() deliberately omitted. Use the contentController instead
    blur: { value: function() { this._element.blur(); } },
    focus: { value: function() { this._element.focus(); } },

    // -------------------
    // Montage Callbacks
    // --------------------

    _addOptionsFromMarkup: {
        value: function() {

            var el = this.element, options = el.querySelectorAll('option');
            // @todo: if contentController is provided, should we just ignore the <option>
            // from the markup ?

            // create a new Arraycontroller if one is not provided
            // add options to contentController
            // look for selected options in the markup and mark these as selected
            if(!this.contentController) {
                var contentController = ContentController.create();
                var selection = [];
                var content = [];

                if(options && options.length > 0) {
                    var i=0, len = options.length, selected;
                    for(; i< len; i++) {
                        selected = options[i].getAttribute('selected');
                        var object = {
                            value: options[i].value,
                            text: options[i].textContent
                        };
                        if (selected) {
                            selection.push(object);
                        }
                        content.push(object);
                    }

                    if (selection.length === 0 && len > 0) {
                        // nothing is marked as selected by default. Select the
                        // first one (gh-122)
                        selection.push(content[0]);
                    }
                    this._fromInput = true;
                    this.contentController = contentController;
                    contentController.content = content;

                    var iterations = contentController.iterations;
                    for (var i = 0, ii = iterations.length; i < ii; i++) {
                        if (selection.indexOf(iterations[i].object)) {
                            iterations[i].selected = true;
                        }
                    }
                }
            }

        }
    },


    deserializedFromTemplate: {
        value: function() {

            /*
            1) If <option> is provided in the markup but contentController is not,
            fill the contentController with the options from the markup
            2) If contentController is present, options from markup will be overwritten
            by the values from contentController when they are available
            */
            this._addOptionsFromMarkup();
        }
    },


    _removeAll: {
        value: function(elem) {
            // remove all existing options
            while (elem.firstChild ) {
                elem.removeChild( elem.firstChild );
            }
        }
    },

    _refreshOptions: {
        value: function() {
            var arr = this.content||[], len = arr.length, i, option;
            var text, value;
            for(i=0; i< len; i++) {
                option = document.createElement('option');
                if(String.isString(arr[i])) {
                    text = value = arr[i];
                } else {
                    text = arr[i][this.textPropertyPath || 'text'];
                    value = arr[i][this.valuePropertyPath  || 'value'];
                }

                option.value = value;
                option.textContent = text || value;

                if(this._selectedIndexes && this._selectedIndexes.length > 0) {
                    if(this._selectedIndexes.indexOf(i) >= 0) {
                        option.setAttribute("selected", "true");
                    }
                }
                this.element.appendChild(option);
            }
        }
    },

    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        value: function() {
            this.element.addEventListener("focus", this);
            this.element.addEventListener('change', this);
        }
    },

    prepareForActivationEvents: {
        value: function() {
            // add pressComposer to handle the claimPointer related work
            var pressComposer = PressComposer.create();
            this.addComposer(pressComposer);
        }
    },

    /**
    Description TODO
    @function
    */
    draw: {
        enumerable: false,
        value: function() {
            var elem = this.element;

            this._fromInput = false;
            this._synching = false;

            this._removeAll(elem);
            this._refreshOptions();

            var fn = Object.getPrototypeOf(Select).draw;
            fn.call(this);

        }
    },

    didDraw: {
        value: function() {
            this._synchValues();
        }
    },



    // find the index of the object with the specified value in the _content array
    _indexOf: {
        value: function(val) {
            var arr = this.content||[], len = arr.length, i;
            var text, value;
            for(i=0; i< len; i++) {
                if(String.isString(arr[i])) {
                    value = arr[i];
                } else {
                    value = arr[i][this.valuePropertyPath  || 'value'];
                }
                if(value && value === val) {
                    return i;
                }
            }
            return -1;
        }
    },

    _getSelectedOptions: {
        value: function(selectEl) {
            var options = selectEl.querySelectorAll('option');
            // TODO: looks like querySelectorAll('option[selected]') only returns the default selected
            // value
            var i, len = options.length, arr = [];
            for(i=0; i< len; i++) {
                if(options[i].selected) {
                    arr.push(options[i]);
                }
            }
            return arr;
        }
    },

    _getSelectedOptionsIndexes: {
        value: function(selectEl) {
            var options = selectEl.querySelectorAll('option');
            // TODO: looks like querySelectorAll('option[selected]') only
            // returns the default selected value
            var i, len = options.length, arr = [];
            for(i=0; i< len; i++) {
                if(options[i].selected) {
                    arr.push(i);
                }
            }
            return arr;
        }
    },

    handleChange: {
        value: function(e) {
            // get selected values and set it on the contentController
            //var selectedOptions = this.element.selectedOptions || [];
            // select.selectedOptions does not work on Chrome !

            var arr = this._getSelectedOptionsIndexes(this.element);

            if(arr.length > 0) {
                this._fromInput = true;
                this._synching = false;
                //this.contentController.selectedIndexes = arr;
                this._setContentControllerSelectedIndexes(arr);
                this._synchValues();
            }

        }
    }


});

//http://www.w3.org/TR/html5/the-button-element.html#the-select-element

Select.addAttributes( /** @lends module:"montage/ui/native/select.reel".Select */ {
/**
    Specifies whether the element should be focused as soon as the page is loaded.
    @type {boolean}
    @default false
*/
        autofocus: {dataType: 'boolean'},

/**
    When true, the select control is disabled to user input and "disabled" is added to its CSS class list.
    @type {boolean}
    @default false
*/
        disabled: {dataType: 'boolean'},

/**
    The value of the <code>id</code> attribute of the form with which to associate the component's element.
    @type string}
    @default null
*/
        form: null,
/**
    Specifies if multiple selections are enabled on the select element.
    @type {boolean}
    @default false
*/
        multiple: {dataType: 'boolean'},

/**
    The name associated with the select input element.
    @type {string}
    @default null
*/
        name: null,

/**
    When true, the user will be required to select a value from the control before submitting the form.
    @type {string}
    @default false
*/
        required: {dataType: 'boolean'},

/**
   The number of options from the select element to display to the user.
   @type {number}
   @default 1
*/
        size: {dataType: 'number', value: '1'}
});

