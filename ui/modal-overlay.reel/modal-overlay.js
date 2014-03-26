/**
 * @module ui/modal-overlay.reel
 */
var Overlay = require("../overlay.reel").Overlay,
    Promise = require("../../core/promise").Promise;

var CLASS_PREFIX = "montage-ModalOverlay";

/**
 * @class ModalOverlay
 * @extends Component
 */
exports.ModalOverlay = Overlay.specialize(/** @lends ModalOverlay# */ {

    constructor: {
        value: function ModalOverlay() {
            this.super();
        }
    },

    enterDocument: {
        value: function(firstTime) {
            var body;

            this.super(firstTime);

            if (firstTime) {
                body = this.element.ownerDocument.body;
                body.appendChild(this.modalMaskElement);
            }
        }
    },

    _queue: {
        value: []
    },

    _showPromise: {
        value: null
    },

    _dismissOnExternalInteraction: {
        value: false
    },

    hasModalMask: {
        value: true
    },

    /**
     * Returns a promise for the show of the overlay. A modal overlay might not
     * be immediately shown if another modal overlay is being shown. When this
     * is the case then only after the previous overlay is hidden will the
     * overlay be shown.
     */
    show: {
        value: function() {
            var queue = this._queue,
                ix = queue.indexOf(this),
                promise;

            // The overlay is not scheduled to draw so we add it to the queue
            // and return a promise that will be solved when shown.
            // If no overlay is being shown (empty queue) then we show it
            // immediately and return a solved promise.
            if (ix === -1) {
                if (queue.length === 0) {
                    this.super();
                    promise = Promise.resolve();
                } else {
                    this._showPromise = Promise.defer();
                    promise = this._showPromise.promise;
                }
                queue.push(this);

                // The overlay is scheduled to draw so we just return the
                // previously created promise. If the overlay is currently
                // being shown (head of the queue) then we add it again to the
                // queue.
            } else {
                if (ix === 0) {
                    this._showPromise = Promise.defer();
                    queue.push(this);
                }
                promise = this._showPromise.promise;
            }

            return promise;
        }
    },

    hide: {
        value: function() {
            var queue = this._queue,
                ix = queue.indexOf(this),
                nextOverlay;

            if (ix === 0) {
                queue.shift();
                this.super();
                if (queue.length > 0) {
                    nextOverlay = queue[0];
                    nextOverlay._showPromise.resolve();
                    Overlay.prototype.show.call(nextOverlay);
                }
            } else if (ix > 0) {
                queue.splice(ix, 1);
                this._showPromise.reject();
            }
        }
    },

    draw: {
        value: function() {
            this.super();

            if (this._isShown && this.hasModalMask) {
                this.modalMaskElement.classList.add(CLASS_PREFIX + "-modalMask--visible");
            } else {
                this.modalMaskElement.classList.remove(CLASS_PREFIX + "-modalMask--visible");
            }
        }
    }

});

