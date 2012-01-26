/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/ui/composer/long-press-composer
    @requires montage
    @requires montage/ui/composer/composer
*/
var Montage = require("montage").Montage,
    Composer = require("ui/composer/composer").Composer;
/**
    @class module:montage/ui/composer/long-press-composer.LongPressComposer
    @extends module:montage/ui/composer/composer.Composer
*/
exports.LongPressComposer = Montage.create(Composer,/** @lends module:montage/ui/event/composer/long-press-composer.LongPressComposer# */ {

/**
  Description TODO
  @private
*/
    _motionThreshold: {
        value: 10
    },
/**
  Description TODO
  @private
*/
    _longpressTimeOut: {
        value: 1500
    },

    _longPressTimer: {
        value: null
    },

    _fingerId: {
        value: null
    },

    _X: {
        value: null
    },

    _Y: {
        value: null
    },

 /**
    Description TODO
    @function
    */
    load: {
        value: function () {
            if (window.Touch) {
                this._element.addEventListener("touchstart", this);
                this._element.addEventListener("touchmove", this);
                this._element.addEventListener("touchend", this);
            } else {
                this._element.addEventListener("mousedown", this);
            }
        }
    },
 /**
    Description TODO
    @function
    */
    unload: {
        value: function () {
            if (window.Touch) {
                this._element.removeEventListener("touchstart", this);
                this._element.removeEventListener("touchmove", this);
                this._element.removeEventListener("touchend", this);
            }
            else {
                this._element.removeEventListener("mousedown", this);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleTouchstart: {
        value: function (event) {
            var self = this;
            /* If two longpress on same target then the first one will be cleared*/
            if (this._longpressTimer) {
                clearTimeout(this._longpressTimer);
                this._longpressTimer = null;
            }
            this._fingerId = event.changedTouches[0].identifier;
            this._X = event.changedTouches[0].clientX;
            this._Y = event.changedTouches[0].clientY;
            this._longpressTimer = null;
            this._longpressTimer = setTimeout(function () {
                // FIXME should be dispatched against something else
                self._dispatchLongPress(self._element);
            }, this._longpressTimeOut);
        }
    },
/**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleTouchmove: {
        value: function (event) {
            var i, deltaX, deltaY;
            /* the longpresstimer is checked so that the flushing of the timer occurs only once even though touchmoves are received */
            if (this._longpressTimer) {
                for (i = 0; i < event.changedTouches.length; i++) {
                    /*Checked if two fingers on same target and both are moved */
                    if (this._fingerId === event.changedTouches[i].identifier) {
                        deltaX = Math.abs(event.changedTouches[i].clientX - this._X);
                        deltaY = Math.abs(event.changedTouches[i].clientY - this._Y);
                        /* Clearing timer only on some considerable motion */
                        if (deltaX > this._motionThreshold || deltaY > this._motionThreshold) {
                            this._clearLongpress(event.currentTarget);
                            break;
                        }
                    }
                }
            }
        }
    },
 /**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleTouchend: {
        value: function (event) {
            var target = event.currentTarget;
            /* longpresstimer checked because end occurs after its move then timer is already cleared. */
            if (this._longpressTimer && this._fingerId === event.changedTouches[0].identifier) {
                this._clearLongpress(target);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleMousedown: {
        value: function (event) {
            var target = event.currentTarget;
            var self = this;
            target.addEventListener("mousemove", this);
            target.addEventListener("mouseup", this);
            target.addEventListener("mouseout", this);
            this._fingerId = 0;
            this._X = event.clientX;
            this._Y = event.clientY;
            this._longpressTimer = setTimeout(function () {
                self._dispatchLongPress(target);
            }, this._longpressTimeOut);
        }
    },
/**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleMouseup: {
        value: function (event) {
            this._clearLongpress(event.currentTarget);
        }
    },
/**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleMouseout: {
        value: function (event) {
            this._clearLongpress(event.currentTarget);
        }
    },
/**
    Description TODO
    @function
    @param {Event} event This event.
    */
    handleMousemove: {
        value: function (event) {
            this._clearLongpress(event.currentTarget);
        }
    },
 /**
  Description TODO
  @private
*/
    _dispatchLongPress: {
        value: function (target) {
            longPressEvent = document.createEvent("CustomEvent");
            longPressEvent.clientX = this._X;
            longPressEvent.clientY = this._Y;
            longPressEvent.identifier = this._fingerId;
            longPressEvent.initCustomEvent("longpress", true, true, null);
            this.dispatchEvent(longPressEvent);
            this._clearLongpress(target);
        }
    },
/**
  Description TODO
  @private
*/
    _clearLongpress: {
        value: function (target) {
            if (this._longpressTimer) {
                clearTimeout(this._longpressTimer);
                this._longpressTimer = null;
                this._X = null;
                this._Y = null;
            }
            if (window.Touch) {
                this._fingerId = null;
            } else {
                target.removeEventListener("mouseup", this);
                target.removeEventListener("mousemove", this);
                target.removeEventListener("mouseout", this);
            }
        }
    }


});
