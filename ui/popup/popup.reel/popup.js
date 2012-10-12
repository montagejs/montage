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
    @module "montage/ui/popup/popup.reel"
    @requires montage/core/core
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component;

/**
    @class module:"montage/ui/popup.reel".Popup
    @extends module:montage/ui/component.Component
*/

var Popup = exports.Popup = Montage.create(Component, { /** @lends module:"module/ui/popup/popup.reel".Popup */

    hasTemplate: {value: true},

    // the HTML Element to which the popup must be anchored to
    anchorElement: {
        value: null
    },

    _anchor: {
        value: null
    },

    /**
    * The HTMLElement or Montage Component that the popup must be anchored to
    */
    anchor: {
        get: function() {
            return this._anchor;
        },
        set: function(value) {
            if(value) {
                this._anchor = value;
                if(value.nodeName) {
                    // HTMLElement
                    this.anchorElement = value;
                } else {
                    this.anchorElement = value.element;
                }
            }
        }
    },

    // A Delegate to control positioning (and other features, in future) of the popup in a custom manner
    delegate: {value: null},

    /**
        Internal property.
        @private
    */
    contentEl: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Container} null
        @private
    */
    containerEl: {
        value: null
    },


/**
  Description TODO
  @private
*/
    _slot: {value: null},
/**

        Description TODO
        @type {Function}
        @default null
    @private
    */
    slot: {
        get: function() {
            return this._slot;
        },
        set: function(val) {
            this._slot = val;
            if (this.content) {
                this._slot.content = this.content;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _content: {value: null},
/**
        The Montage component that will be shown in this popup.

        @type {Function}
        @default null
    */
    content: {
        get: function() {
            return this._content;
        },
        set: function(value) {
            if (this._content !== value && this.slot) {
                this.slot.content = value;
            }
            this._content = value;
            // set the popup property of the content.
            this._content.popup = this;
            this.needsDraw = true;
        }
    },
/**
  Description TODO
  @private
*/
    _modal: { value: false },
/**
        If true, the Popup will be rendered as a Modal.

        @type {Function}
        @default {Boolean} false
    */
    modal: {
        get: function() {
            return this._modal;
        },
        set: function(value) {
            // force this to be a boolean
            value = !!value;

            if (this._modal !== value) {
                this._modal = value;
                this.needsDraw = true;
            }
        }
    },

    /**
        An Object wtih values {top, left}. Set it only if the popup should display at a
        given location always.
    */
    _position: {value: null},
    position: {
        get: function() {
            return this._position;
        },
        set: function(pos) {
            this._position = pos;
            //this.needsDraw = true;
        }
    },

    /**
    * Number of milliseconds after which the Popup must be dismissed. Default is 0.
    */
    autoHide: { value: 0 },

    /** @private */
    _displayed: { value: false },
    displayed: {
        get: function() {
            return this._displayed;
        },
        set: function(value) {
            if (this._displayed !== value) {
                this.needsDraw = true;
            }
            this._displayed = value;
        }
    },

    focusOnShow: {
        value: true
    },

/**
    Description TODO
    @function
    */
    prepareForDraw: {
        value: function() {
            this.type = this.type || 'custom';
        }
    },

    _popupSlot: {
        value: null
    },

    _modalDialogMask: {
        value: null
    },


    /**
     Internal method.
     @private
     */
    _getElementPosition: {
        value: function(obj) {
            var curleft = 0, curtop = 0, curHt = 0, curWd = 0;
            if (obj.offsetParent) {
                do {
                    curleft += obj.offsetLeft;
                    curtop += obj.offsetTop;
                    curHt += obj.offsetHeight;
                    curWd += obj.offsetWidth;
                } while ((obj = obj.offsetParent));
            }
            return {
                top: curtop,
                left: curleft,
                height: curHt,
                width: curWd
            };
            //return [curleft,curtop, curHt, curWd];

        }
    },

    _getCSSValue: {
        value: function(value) {
            if(value != null) {
                if(typeof value === 'number') {
                    value = value + 'px';
                }
                return value;
            }
            return '';
        }
    },

    _positionPopup: {
        value: function() {
            var defaultPosition, position, delegate = this.delegate, anchor = this.anchorElement, type = this.type;

            if(this.position !== null) {
                // If a position has been specified but no delegate has been provided
                // we assume that the position is static and hence use that
                defaultPosition = this.position;
            } else {
                // @todo - advanced positioning support
                var $el = this.contentEl || this.content.element;
                var elHeight = parseFloat($el.style.height || 0) || $el.offsetHeight || 0;
                var elWidth = parseFloat($el.style.width || 0) || $el.offsetWidth || 0;

                // @todo - to get the window from application
                var viewportHeight = window.innerHeight;
                var viewportWidth = window.innerWidth;

                if (anchor) {
                    // if an anchor is provided, we position the popup relative to the anchor
                    var elPosition = this._getElementPosition(anchor);
                    var tgtHeight = parseFloat(anchor.style.height || 0) || anchor.offsetHeight || 0;
                    var tgtWidth = parseFloat(anchor.style.width || 0) || anchor.offsetWidth || 0;

                    defaultPosition = {
                        top: elPosition.top + tgtHeight,
                        left: elPosition.left + (tgtWidth / 2) - (elWidth / 2)
                    };

                    if (defaultPosition.left < 0) {
                        defaultPosition.left = elPosition.left;
                        this._showHidePointer(false);
                        // dont show the pointer - @todo - support pointer arrow at different parts of the popup
                    }

                } else {
                    // No positioning hints provided. POsition it at the center of the viewport by default
                    defaultPosition = {
                        top: (viewportHeight / 2 - (elHeight / 2)),
                        left: (viewportWidth / 2 - (elWidth / 2))
                    };
                }
            }


            // if a delegate is provided, use that to get the position
            if(delegate && (typeof delegate.willPositionPopup === 'function')) {
                position = delegate.willPositionPopup(this, defaultPosition);
            } else {
                position = defaultPosition;
            }

            //this.position = position;
            var popupSlot = this._popupSlot;

            if(position) {
                popupSlot.element.style.top = this._getCSSValue(position.top);
                popupSlot.element.style.left = this._getCSSValue(position.left);
                popupSlot.element.style.right = this._getCSSValue(position.right);
                popupSlot.element.style.bottom = this._getCSSValue(position.bottom);
            }

        }
    },


    _createModalMask: {
        value: function() {
            var el = document.createElement('div');
            el.classList.add('montage-Popup-modal-mask');
            el.style.zIndex = 6999;
            el.classList.add('montage-invisible');

            document.body.appendChild(el);
            return el;
        }
    },

    _showHidePointer: {
        value: function(showTip) {
        }
    },

    _addEventListeners: {
        value: function() {
            if (window.Touch) {
                this.element.ownerDocument.addEventListener('touchstart', this, false);
            } else {
                this.element.ownerDocument.addEventListener('mousedown', this, false);
                this.element.ownerDocument.addEventListener('keyup', this, false);
            }
            window.addEventListener('resize', this);
        }
    },

    _removeEventListeners: {
        value: function() {
            if (window.Touch) {
                this.element.ownerDocument.removeEventListener('touchstart', this, false);
            } else {
                this.element.ownerDocument.removeEventListener('mousedown', this, false);
                this.element.ownerDocument.removeEventListener('keyup', this, false);
            }
            window.removeEventListener('resize', this);
        }
    },

    /**
    * Show the Popup. The Popup is displayed at a position determined by the following conditions:
    * 1) If a delegate is provided and the willPositionPopup function is implemented, the position is always determined by the delegate
    * 2) If Popup.position has been set, the Popup is always displayed at this location
    * 3) If an anchor has been set, the popup is displayed below the anchor
    * 4) If no positional hints are provided, the Popup is displayed at the center of the screen
    */
    show: {
        value: function() {
            //console.log("popup show", this.element);
            var type = this.type,
                self = this;
            this.application.getPopupSlot(type, this, function(slot) {
                self._popupSlot = slot;
                self.displayed = true;
                self._addEventListeners();
            });
        }
    },

    /**
    * Hide the popup
    */
    hide: {
        value: function() {
            //console.log('popup hide', this.element);
            var type = this.type,
                self = this;

            this.application.getPopupSlot(type, this, function(slot) {
                self._removeEventListeners();
                //self.application.returnPopupSlot(type);
                self.displayed = false;
            });
        }
    },

    _showModalMask: {
        value: function() {
            this._modalDialogMask = document.querySelector('.montage-Popup-modal-mask');
            this._modalDialogMask = this._modalDialogMask || this._createModalMask();
            this._modalDialogMask.classList.remove('montage-invisible');
        }
    },

    _hideModalMask: {
        value: function() {
            // check to see if there is at least one modal dialog in the DOM
            // See https://github.com/Motorola-Mobility/montage/issues/32
            var activePopups = this.application._getActivePopupSlots();
            var count = 0;
            if(activePopups && activePopups.length > 0) {
                // look to see if any content is a modal
                var i, len = activePopups.length;
                for(i=0; i< len; i++) {
                    if(activePopups[i].content && activePopups[i].content.modal === true && activePopups[i].content.displayed === true) {
                        count++;
                    }
                }
            }
            if(count <= 0) {
                this._modalDialogMask.classList.add('montage-invisible');
            }
        }
    },


    draw: {
        value: function() {
            if (this.displayed) {

                if(this.modal === true) {
                    this.element.classList.add('montage-Popup--modal');
                } else {
                    this.element.classList.remove('montage-Popup--modal');

                    if (this.autoHide) {
                        var self = this;
                        setTimeout(function() {
                            self.hide();
                        }, this.autoHide);
                    }

                }

                // @todo - positioning should happen inside the draw. Looks like this is only possible
                // with a double draw where we calculate the position on didDraw and position it in draw().
                // For the first release, we position inside the didDraw
                //this._positionPopup();

                this.element.classList.remove('montage-invisible');
                this.content.element.style.display = 'block';
                this.content.element.classList.remove('montage-invisible');
                // TODO do we want the panel to be focusable?
                this.content.element.setAttribute("tabindex", "0"); // Make the popup content focusable

            } else {
                if (!this.element.classList.contains('montage-invisible')) {
                    this.element.classList.add('montage-invisible');
                }
                this.content.element.classList.add('montage-invisible');
                if(this._popupSlot) {
                    this._popupSlot.content = null;
                }
            }
        }
    },
/**
    Description TODO
    @function
    */
    didDraw: {
        value: function() {
            if (this._displayed) {

                if(this.modal === true) {
                    this._showModalMask();
                }

                this._positionPopup();
                // focus the content to enable key events such as ENTER/ESC
                if(this.focusOnShow === true) {
                    this.content.element.focus();
                }

            } else {
                if(this.modal === true) {
                    this._hideModalMask();
                }
            }
            // kishore: invoking this event in didDraw as we need the dimensions of the content.
            // Inside the draw(), the display is set to none at the top level and hence
            // offsetWidth and Height are always 0
            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent((this._displayed === true ? 'show' : 'hide'), true, true, this);
            this.dispatchEvent(evt);

        }
    },

    getZIndex: {
        value: function(elem) {

            var position, value, zIndex;
            while (elem && elem !== document) {
                position = elem.style.position;
                if (position === "absolute" || position === "relative" || position === "fixed") {
                    // webkit returns a string for zindex value and "" if zindex is not available
                    zIndex = elem.style['z-index'];
                    value = parseInt(zIndex, 10);
                    if (!isNaN(value) && value !== 0) {
                        return value;
                    }
                }
                elem = elem.parentNode;
            }
            return 0;
        }
    },
/**
  Description TODO
  @private
*/
    _handleTouchMouseup: {
        value: function(event) {
            var targetzIndex = this.getZIndex(event.target),
                zIndex = this.getZIndex(this.element);

            if (this.displayed === true && targetzIndex < zIndex) {
                if (this.modal === true) {

                } else {
                    // hide the dialog when user clicks outside it
                    this.displayed = false;
                }
            }
        }
    },

    _timeoutId: {value: null},
    handleResize: {
        value: function(e) {
            //console.log('window resize');
            var self = this;
            if(this.displayed === true) {
                // an optimization to call positionPopup fewer times
                window.clearTimeout(this._timeoutId);
                this._timeoutId = setTimeout(function() {
                    self.needsDraw = true;
                }, 100);
            }
         }
     },
     handleMousedown: {
         value: function(event) {
            this._handleTouchMouseup(event);
        }
    },
/**
    Description TODO
    @function
    @param {Event} event The event.
    */
    handleTouchstart: {
        value: function(event) {
            this._handleTouchMouseup(event);
        }
    },
    handleKeyup: {
        value: function(e) {
            // default handling of the keyup event. Content inside the popup could
            // handle the event optionally for custom behavior
            if(this.displayed === true && !this.modal && e.keyCode === 27 /* ESC key */) {
               this.hide();
            }
        }
    }
});
