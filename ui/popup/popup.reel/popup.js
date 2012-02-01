/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
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

    // anchor element to which this popup must be anchored to
    anchor: {value: null},

    // A Delegate to control positioning (and other features, in future) of the popup in a custom manner
    delegate: {value: null},

    contentEl: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Container} null
    */
    containerEl: {
        value: null
    },

/**
  Description TODO
  @private
*/
    _pointer: {
        value: true
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} true
    */
    pointer: {
        get: function() {
            return this._pointer;
        },
        set: function(value) {
            if (this._pointer !== value) {
                this._pointer = value;
                this.needsDraw = true;
            }
        }
    },
/**
  Description TODO
  @private
*/
    _boxed: {
        value: true
    },
/**
        Description TODO
        @type {Function}
        @default {Boolean} true
    */
    boxed: {
        get: function() {
            return this._boxed;
        },
        set: function(value) {
            if (this._boxed !== value) {
                this._boxed = value;
                this.needsDraw = true;
            }
        }
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
        Description TODO
        @type {Function}
        @default null
    */
    content: {
        serializable: true,
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
        Description TODO
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

    // An Object wtih values {top, left}. Set it only if the popup should display at a
    // given location instead of anchoring it to a anchor element or at the center of the screen.
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

    autoDismiss: { value: 0 },

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
     @private
     */
    _getPosition: {
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
            return [curleft,curtop, curHt, curWd];

        }
    },

    _calculatePosition: {
        value: function() {
            var pos, delegate = this.delegate, anchor = this.anchor, type = this.type;

            if(delegate && (typeof delegate.positionPopup === 'function')) {
                var anchorPosition;
                if(anchor) {
                    anchorPosition = this._getPosition(anchor);
                }
                pos = delegate.positionPopup(this, anchor, anchorPosition);
            } else {
                // @todo - advanced positioning support
                var $el = this.contentEl || this.content.element;
                var elHeight = parseFloat($el.style.height || 0) || $el.offsetHeight || 0;
                var elWidth = parseFloat($el.style.width || 0) || $el.offsetWidth || 0;

                // @todo - to get the window from application
                var viewportHeight = window.innerHeight;
                var viewportWidth = window.innerWidth;

                if (anchor) {
                    if (anchor.nodeName) {
                        // if anchor is an element
                        var elPosition = this._getPosition(anchor);
                        var tgtHeight = parseFloat(anchor.style.height || 0) || anchor.offsetHeight || 0;
                        var tgtWidth = parseFloat(anchor.style.width || 0) || anchor.offsetWidth || 0;

                        pos = {
                            top: elPosition[1] + tgtHeight + 20 /* pointer */,
                            left: elPosition[0] + (tgtWidth / 2) - (elWidth / 2)
                        };

                        if (pos.left < 0) {
                            pos.left = elPosition[0];
                            this._showHidePointer(false);
                            // dont show the pointer - @todo - support pointer arrow at different parts of the popup
                        }
                    } else {
                        // anchor is absolute position {top, left}
                        pos = anchor;
                    }
                } else {
                    // position it at top or center
                    // for now, just show it at center
                    pos = {
                        top: (viewportHeight / 2 - (elHeight / 2)),
                        left: (viewportWidth / 2 - (elWidth / 2))
                    };
                }
            }
            return pos;
        }
    },

    _positionPopup: {
        value: function() {
            //console.log('--> position popup');
            var pos = this.position;
            var popupSlot = this._popupSlot;

            if(pos) {
                if (pos.top) {
                    popupSlot.element.style.top = pos.top + 'px';
                }
                if (pos.left) {
                    popupSlot.element.style.left = pos.left + 'px';
                }
                if (pos.right) {
                    popupSlot.element.style.right = pos.right + 'px';
                }
                if (pos.bottom) {
                    popupSlot.element.style.bottom = pos.bottom + 'px';
                }
            }
        }
    },

    _createModalMask: {
        value: function() {
            var el = document.createElement('div');
            el.classList.add('montage-popup-modal-mask');
            el.style['z-index'] = 6999;
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

    show: {
        value: function() {
            var type = this.type,
                self = this;
            this.application.getPopupSlot(type, this, function(slot) {
                self._popupSlot = slot;
                self.displayed = true;
                self._addEventListeners();
            });
        }
    },

    hide: {
        value: function() {
            this._removeEventListeners();

            var type = this.type,
                self = this;

            this.application.returnPopupSlot(type);
            this.displayed = false;
        }
    },

    _showModalMask: {
        value: function() {
            this._modalDialogMask = document.querySelector('.montage-popup-modal-mask');
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
                    if(activePopups[i].content && activePopups[i].content.modal === true) {
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
                // custom, alert, confirm, notify
                // only one popup of each type can be displayed at the same time
                // kishore - does the above restriction make sense ? should we restrict it ?

                if(this.modal === true) {
                    this.element.classList.add('montage-modal');
                } else {
                    this.element.classList.remove('montage-modal');
                }

                // @todo - positioning should happen inside the draw. Looks like this is only possible
                // with a double draw where we calculate the position on didDraw and position it in draw().
                // For the first release, we position inside the didDraw
                //this._positionPopup();

                this.element.classList.remove('montage-invisible');
                this.content.element.style.display = 'block';
                this.content.element.classList.remove('montage-invisible');
                // TODO do we want the panel to be focusable?
                // this.content.element.setAttribute("tabindex", "0"); // Make the alert focusable

                if (this.autoDismiss) {
                    var self = this;
                    setTimeout(function() {
                        self.hide();
                    }, this.autoDismiss);
                }
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
                this.content.element.focus();

                if(this.modal === true) {
                    this._showModalMask();
                }

                this.position = this.position || this._calculatePosition();
                this._positionPopup();

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
                    //self._positionPopup();
                    self.position = self._calculatePosition();
                    self._positionPopup();
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
