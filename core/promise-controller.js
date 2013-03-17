
// A promise does not have bindable properties.  This controller tracks the
// state of a promise with bindable properties so you can create a substitution
// that binds the viewed component with the state of the promise.

// -    "pending" with "progress"
//          when in the pending state, bind the substituted component to the
//          progress value, which is null when indeterminate or a 0-1 value
//          when determinate.  Most promises are indeterminate due to the
//          complexities of composing progress information into meaningful
//          data.
// -    "fulfilled" with "value"
//          when in the fulfilled state, bind the substituted component to the
//          value.
// -    "rejected" with "error"
//          when in the rejected state, bind the substituted component to the
//          given error, if you can surface that error to the user.
// -    "state" (one of "pending", "fulfilled", or "rejected")
//          suitable for substitutions that will always render an indeterminate
//          progress in the "pending" state.
// -    "progressState" (one of "determinate", "indeterminate", "fuilfilled", "rejected")
//          suitable for substitutions that provide alternative view for
//          determinate and indeterminate progress.

var Promise = require("core/promise").Promise;

var PromiseController = exports.PromiseController = Montage.create(Montage, {

    didCreate: {
        value: function () {
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

    handlePromiseChange: {
        value: function (promise) {
            var self = this;
            promise = Promise.resolve(promise); // coerce

            // when a promise controller changes hands, the previous "then"
            // call might send updates.  Resetting the previous promise
            // prevents those updates from being applied to the controller.
            if (self.reset) {
                self.reset();
            }
            var reset = false;
            self.reset = function () {
                reset = true;
            };

            // these get set in the context of didCreate, in order, helping
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
                    self.determinate = progress != null;
                }
            );

        }
    }

});

