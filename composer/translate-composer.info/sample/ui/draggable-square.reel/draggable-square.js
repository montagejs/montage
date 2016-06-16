/**
 * @module ui/draggable-square.reel
 */
var Component = require("montage/ui/component").Component,
    TranslateComposer = require("montage/composer/translate-composer").TranslateComposer;

/**
 * @class DraggableSquare
 * @extends Component
 */
var DraggableSquare = exports.DraggableSquare = Component.specialize(/** @lends DraggableSquare# */ {

    _translateX: {
        value: 0
    },

    _translateY: {
        value: 0
    },

    _isDragging: {
        value: false
    },


    __translateComposer: {
        value: null
    },

    _translateComposer: {
        get: function () {
            if (!this.__translateComposer) {
                this.__translateComposer = new TranslateComposer();
                this.__translateComposer.hasMomentum = false;

                this.addComposer(this.__translateComposer);
            }

            return this.__translateComposer;
        }
    },

    enterDocument: {
        value: function () {
            if (!DraggableSquare.cssTransform) {// check for transform support
                var element = this._element;

                if("webkitTransform" in element.style) {
                    DraggableSquare.cssTransform = "webkitTransform";
                } else if("MozTransform" in element.style) {
                    DraggableSquare.cssTransform = "MozTransform";
                } else if("oTransform" in element.style) {
                    DraggableSquare.cssTransform= "oTransform";
                } else {
                    DraggableSquare.cssTransform = "transform";
                }
            }

            if (this.__translateComposer) {
                this._startListenToTranslateStartIfNeeded();

                //todo: provide a method to reset the transalte composer context.
                this.__translateComposer.translateX = 0;
                this.__translateComposer.translateY = 0;
                this._translateX = 0;
                this._translateY = 0;
            }
        }
    },

    exitDocument: {
        value: function () {
            this._stopListenToTranslateStartIfNeeded();
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this._startListenToTranslateStartIfNeeded(true);
        }
    },

    _startListenToTranslateStartIfNeeded: {
        value: function (force) {
            if (force || this.preparedForActivationEvents) {
                this._translateComposer.addEventListener('translateStart', this, false);
            }
        }
    },

    _stopListenToTranslateStartIfNeeded: {
        value: function () {
            if (this.preparedForActivationEvents) {
                this._translateComposer.removeEventListener("translateStart", this, false);
            }
        }
    },

    _addEventListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateCancel', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);
        }
    },

    _removeEventListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this, false);
            this._translateComposer.removeEventListener('translateCancel', this, false);
            this._translateComposer.removeEventListener('translateEnd', this, false);
        }
    },

    handleTranslateStart: {
        value: function (event) {
            var startPosition = this._translateComposer.pointerStartEventPosition;
            this._startPositionX = startPosition.pageX;
            this._startPositionY = startPosition.pageY;

            this._addEventListeners();
            console.log(this.identifier, event.type);
            this.classList.add("active")
        }
    },

    handleTranslate: {
        value: function (event) {
            this._translateX = event.translateX;
            this._translateY = event.translateY;

            event.startPositionX = this._startPositionX;
            event.startPositionY = this._startPositionY;

            this._isDragging = true;
            console.log(this.identifier, event.type);
            this.needsDraw = true;
            this.classList.remove("active")
        }
    },

    handleTranslateEnd: {
        value: function (event) {
            this._isDragging = false;

            this.needsDraw = true;
            console.log(this.identifier, event.type);
            this.classList.remove("active")
        }
    },

    draw: {
        value: function () {
            if (this._isDragging) {
                this.classList.add("dragging");
            } else {
                this.classList.remove("dragging");
            }

            this._element.style[DraggableSquare.cssTransform] = "translate3d(" + this._translateX + "px," + this._translateY + "px,0)";
        }
    }
});


DraggableSquare.prototype.handleTranslateCancel = DraggableSquare.prototype.handleTranslateEnd;
