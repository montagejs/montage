
var Montage = require("montage").Montage;
var Promise = require("core/promise").Promise;

/**
 * A promise does not have bindable properties. This controller tracks the
 * state of a promise with bindable properties so you can create a substitution
 * that binds the viewed component with the state of the promise.
 *
 * -    "pending" with "progress"
 *          when in the pending state, bind the substituted component to the
 *          progress value, which is null when indeterminate or a 0-1 value
 *          when determinate. Most promises are indeterminate due to the
 *          complexities of composing progress information into meaningful
 *          data.
 * -    "fulfilled" with "value"
 *          when in the fulfilled state, bind the substituted component to the
 *          value.
 * -    "rejected" with "error"
 *          when in the rejected state, bind the substituted component to the
 *          given error, if you can surface that error to the user.
 * -    "state" (one of "pending", "fulfilled", or "rejected")
 *          suitable for substitutions that will always render an indeterminate
 *          progress in the "pending" state.
 * -    "progressState" (one of "determinate", "indeterminate", "fuilfilled", "rejected")
 *          suitable for substitutions that provide alternative view for
 *          determinate and indeterminate progress.
 *
 * @class PromiseController
 * @classdesc Provides bindable properties for the state of a promise
 */
var PromiseController = exports.PromiseController = Montage.specialize( {

    constructor: {
        value: function PromiseController() {
            this.reset = null;
            this.addOwnPropertyChangeListener("promise", this);
            this.promise = null;
            this.defineBindings({
                "state == 'pending'": {"<-": "pending"},
                "state == 'fulfilled'": {"<-": "fulfilled"},
                "state == 'rejected'": {"<-": "rejected"},
                "progressState == 'determinate'": {"<-": "pending && determinate"},
                "progressState == 'indeterminate'": {"<-": "pending && determinate"},
                "progressState == 'fulfilled'": {"<-": "fulfilled"},
                "progressState == 'rejected'": {"<-": "rejected"}
            });
        }
    },

    /**
     * The promise whose state is interesting.
     * @type {Promise}
     */
    promise: {value: null},

    /**
     * One of "pending", "fulfilled", "rejected".
     * @type {string}
     */
    state: {value: null},

    /**
     * One of "determinate", "indeterminate", "fulfilled", "rejected".
     * @type {string}
     */
    progressState: {value: null},

    /**
     * Whether `promise` is in a pending state, in progress.
     * @type {boolean}
     */
    pending: {value: null},

    /**
     * Whether `promise` is in a fulfilled state, with a `value`.
     * @type {boolean}
     */
    fulfilled: {value: null},

    /**
     * Whether `promise` is in a rejected state, with a `error`.
     * @type {boolean}
     */
    rejected: {value: null},

    /**
     * Whether `promise` is in a determinate progress sate, meaning that it has
     * provided a `progress` ratio with its most recent progress event.
     * @type {boolean}
     */
    determinate: {value: null},

    /**
     * The last known progress value emitted by the promise.
     */
    progress: {value: null},

    /**
     * The fulfillment value of the promise, if any.
     */
    value: {value: null},

    /**
     * The error from the promise, if it was rejected.
     * @type {?Error}
     */
    error: {value: null},

    handlePromiseChange: {
        value: function (promise) {
            var self = this;
            promise = Promise.resolve(promise); // coerce

            // When a promise controller changes hands, the previous "then"
            // call might send updates. Resetting the previous promise prevents
            // those updates from being applied to the controller.
            if (self.reset) {
                self.reset();
            }
            var reset = false;
            self.reset = function () {
                reset = true;
            };

            // these get set in the context of constructor, in order, helping
            // toward the goal that all promise controllers have the same
            // hidden class by the end of this sequence
            self.value = null;
            self.error = null;
            self.progress = 0;
            self.determinate = false;
            self.pending = true;
            self.fulfilled = false;
            self.rejected = false;

            promise.then(
                function (value) {
                    if (reset)
                        return;
                    self.fulfilled = true;
                    self.value = value;
                    self.progress = 1;
                },
                function (error) {
                    if (reset)
                        return;
                    self.rejected = true;
                    self.error = error;
                },
                function (progress) {
                    if (reset)
                        return;
                    self.progress = progress;
                    self.determinate = typeof progress === "number";
                }
            );

        }
    }

});

