/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    ArrayController = require("ui/controller/array-controller").ArrayController,
    NativeControl = require("ui/native-control").NativeControl,
    PressComposer = require("ui/composer/press-composer").PressComposer;

var SelectInput = exports.SelectInput =  Montage.create(NativeControl, {

    _fromInput: {value: null},

    __selectedIndexes: {value: null, enumerable: false},
    _selectedIndexes: {
        set: function(value) {
            this.__selectedIndexes = value;
            if(!this._fromInput) {
                this.needsDraw = true;
            } else {
                this._fromInput = false;
            }
        },
        get: function() {
            return this.__selectedIndexes;
        }
    },

    //-----------------------
    // Public API
    //-----------------------

    _content: {value: null, enumerable: false},
    content: {
        set: function(value) {
            if(!Array.isArray(value)) {
                value = [value];
            }
            this._content = value;

            if(!this.contentController) {
                var contentController = ArrayController.create();
                contentController.content = value;
                this.contentController = contentController;
            }

            this.needsDraw = true;
        },
        get: function() {
            return this._content;
        }
    },

    // If contentController is provided, this allows the developer to specify
    // which property in each element provides the "value" part of <option>
    valuePropertyPath: {value: null},
    // Property on iterated object from which textContent of the <option>
    // is received
    textPropertyPath: {value: null},


    _contentController: {value: null, enumerable: false},
    contentController: {
        get: function() {
            return this._contentController;
        },
        set: function(value) {
            if (this._contentController === value) {
                return;
            }

            if (this._contentController) {
                Object.deleteBinding(this, "_selectedIndexes");
            }

            this._contentController = value;

            if (this._contentController) {

                // If we're already getting contentController related values from other bindings...stop that
                if (this._bindingDescriptors) {
                    Object.deleteBinding(this, "content");
                }

                Object.defineBinding(this, "content", {
                    boundObject: this._contentController,
                    boundObjectPropertyPath: "organizedObjects",
                    oneway: true
                });


                Object.defineBinding(this, "_selectedIndexes", {
                    boundObject: this._contentController,
                    boundObjectPropertyPath: "selectedIndexes"
                });
            }

        }
    },

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
                var contentController = ArrayController.create();
                var selectedIndexes = [];

                contentController.content = [];
                if(options && options.length > 0) {
                    var i=0, len = options.length, selected;
                    for(; i< len; i++) {
                        selected = options[i].getAttribute('selected');
                        if(selected) {
                            selectedIndexes.push(i);
                        }
                        contentController.addObjects({
                            value: options[i].value,
                            text: options[i].textContent
                        });
                    }

                    this.contentController = contentController;

                    if(selectedIndexes.length > 0) {
                        this._fromInput = true;
                        this.contentController.selectedIndexes = selectedIndexes;
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
        enumerable: false,
        value: function() {

        }
    },

    prepareForActivationEvents: {
        value: function() {
            // add pressComposer to handle the claimPointer related work
            var pressComposer = PressComposer.create();
            this.addComposer(pressComposer);

            var el = this.element;
            el.addEventListener("focus", this);
            el.addEventListener('change', this);
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

            this._removeAll(elem);
            this._refreshOptions();

            var fn = Object.getPrototypeOf(SelectInput).draw;
            fn.call(this);

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

    _getSelectedOptionsIndices: {
        value: function(selectEl) {
            var options = selectEl.querySelectorAll('option');
            // TODO: looks like querySelectorAll('option[selected]') only returns the default selected
            // value
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

            var arr = this._getSelectedOptionsIndices(this.element);

            if(arr.length > 0) {
                this._fromInput = true;
                this.contentController.selectedIndexes = arr;
            }
        }
    }


});

//http://www.w3.org/TR/html5/the-button-element.html#the-select-element

SelectInput.addAttributes({
        autofocus: null,
        disabled: {dataType: 'boolean'},
        form: null,
        multiple: {dataType: 'boolean'},
        name: null,
        required: {dataType: 'boolean'},
        size: {dataType: 'number', value: '1'}
});

