/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    ArrayController = require("ui/controller/array-controller").ArrayController,
    NativeControl = require("ui/native-control").NativeControl;

    var STRING_CLASS = '[object String]';
    var _toString = Object.prototype.toString;
    var isString = function(object) {
        return _toString.call(object) === STRING_CLASS;
    };
    
var SelectInput = exports.SelectInput =  Montage.create(NativeControl, {
    
    _fromInput: {value: null},    
    
    __objects: {value: null, enumerable: false},
    _objects: {
        set: function(value) {
            this.__objects = value;
            this.needsDraw = true;
        },
        get: function() {
            return this.__objects;
        }
    },
    
    __selectedIndexes: {value: null, enumerable: false},
    _selectedIndexes: {
        set: function(value) {
            this.__selectedIndexes = value;
            if(this.contentController) {
                this.selectedObjects = this.contentController.selectedObjects;
            }
            
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
    
    
    // If contentController is provided, this allows the developer to specify
    // which property in each element provides the "value" part of <option>
    valuePropertyPath: {value: null},
    // Property on iterated object from which textContent of the <option>
    // is received
    textPropertyPath: {value: null},
    
    
    // selected items from the underlying contentController
    selectedObjects: {value: null},
    
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
                Object.deleteBinding(this, "_objects");
                Object.deleteBinding(this, "_selectedIndexes");
            }

            this._contentController = value;

            if (this._contentController) {

                // If we're already getting contentController related values from other bindings...stop that
                if (this._bindingDescriptors) {
                    Object.deleteBinding(this, "_objects");
                }

                Object.defineBinding(this, "_objects", {
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

    // Callbacks
    
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
            // @todo - Need a better way to do this. 
            var fn = Object.getPrototypeOf(SelectInput).deserializedFromTemplate;
            fn.call(this);
            
            /*
            1) If <option> is provided in the markup but contentController is not, 
            fill the contentController with the options from the markup
            2) If contentController is present, options from markup will be overwritten 
            by the values from contentController when they are available
            */
            this._addOptionsFromMarkup();
        }
    },
    
    /**
    Description TODO
    @function
    */
    prepareForDraw: {
        enumerable: false,
        value: function() {
            var el = this.element;
            el.addEventListener("focus", this);
            el.addEventListener('change', this);
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
            console.log('==== refreshOptions ====');
            var arr = this._objects||[], len = arr.length, i, option;
            var text, value;
            for(i=0; i< len; i++) {
                option = document.createElement('option');
                if(isString(arr[i])) {
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
    
    // find the index of the object with the specified value in the _objects array 
    _indexOf: {
        value: function(val) {
            var arr = this._objects||[], len = arr.length, i;
            var text, value;
            for(i=0; i< len; i++) {
                if(isString(arr[i])) {
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
    
    handleChange: {
        value: function(e) {
            // get selected values and set it on the contentController
            console.log('selection changed');
            console.log(this.element.value);
            var index = this._indexOf(this.element.value);
            if(index >= 0) {
                // @todo: handle multiple selections
                this._fromInput = true;
                this.contentController.selectedIndexes = [index];
            }
        }
    }


});

//http://www.w3.org/TR/html5/the-button-element.html#the-select-element

SelectInput.addProperties({        
        //autofocus: null,
        disabled: {dataType: 'boolean'},
        //form: null,
        multiple: {dataType: 'boolean'},
        name: null,
        required: {dataType: 'boolean'},
        size: {dataType: 'number', value: '1'}
});

