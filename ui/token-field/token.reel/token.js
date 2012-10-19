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
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

exports.Token = Montage.create(Component, {

    _text: {
        value: null
    },

    text: {
        dependencies: ["value", "textPropertyPath"],
        get: function() {
            var textPropertyPath,
                value,
                text;

            if (this._text == null) {
                this._adHoc = false;
                textPropertyPath = this.textPropertyPath;
                value = this.value;

                if (textPropertyPath != null && value != null) {
                    if (typeof value[textPropertyPath] === 'undefined' && this.allowAdHocValues) {
                        this._adHoc = true;
                        this._text = value;
                    } else {
                        this._text = value[textPropertyPath];
                    }
                } else {
                    this._text = value;
                }
            }

            return this._text;
        }
    },

    allowAdHocValues: {value: null},

    _value: {
        value: null
    },

    value: {
        get: function() {
            return this._value;
        },
        set: function(aValue) {
            this._value = aValue;
            this._text = null;
        }
    },

    textPropertyPath: {value: null},

    tokensController: {value: null},

    // private

    __adHoc: {value: null},
    _adHoc: {
        get: function() {
            return this.__adHoc;
        },
        set: function(value) {
            this.__adHoc = value;
            this.needsDraw = true;
        }
    },

    _deleteEl: {value: null},

    prepareForDraw: {
        value: function() {
            if(window.Touch) {
                this._deleteEl.addEventListener('touchend', this);
            } else {
                this._deleteEl.addEventListener('click', this);
            }
        }
    },

    draw: {
        value: function() {
            this.element.classList[this._adHoc ? 'add' : 'remove']('montage-Token--adhoc');
        }
    },

    // Event handling

    removeSelf: {
        value: function() {
            this.tokensController.selectedObjects = [this.value];
            this.tokensController.removeObjectsAtSelectedIndexes();
            this.tokensController.selectedIndexes = [];
        }
    },

   handleClick: {
       value: function(event) {
           this.removeSelf();
       }
   },
   handleTouchend: {
       value: function(event) {
          this.removeSelf();
      }
  }

});
