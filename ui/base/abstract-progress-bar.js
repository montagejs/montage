/**
 * @module ui/base/abstract-progress-bar.js
 */
var AbstractControl = require("./abstract-control").AbstractControl;

/**
 * @class AbstractProgressBar
 * @extends Component
 */
var AbstractProgressBar = exports.AbstractProgressBar = AbstractControl.specialize(/** @lends AbstractProgressBar# */ {

    constructor: {
        value: function AbstractProgressBar() {
            if (this.constructor === AbstractProgressBar) {
                throw new Error("AbstractProgressBar cannot be instantiated.");
            }

            this.super();
        }
    }

});


AbstractProgressBar.addAttributes( /** @lends module:montage/base/ui/abstract-progress-bar.AbstractProgressBar# */ {

    /**
     The current value displayed but the progress control.
     @type {number}
     @default null
     */
    value: {dataType: 'number'},

    /**
     The maximum value displayed but the progress control.
     @type {number}
     @default null
     */
    max: {dataType: 'number'}
});
