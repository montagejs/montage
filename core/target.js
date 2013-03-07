var Montage = require("montage").Montage,
    defaultEventManager = require("core/event/event-manager").defaultEventManager;

/**
 * A Target is any object that can be a candidate for dispatching and receiving events
 * throughout what is typically considered the "component tree" of a Montage application.
 *
 * @type {Target}
 */
exports.Target = Montage.create(Montage, {

    /**
     * Whether or not this target can accept user focus and become the activeTarget
     * This matches up with the <code>document.activeElement</code> property purpose-wise;
     * Events from components that should be dispatched as logically occurring at the point
     * of user focus should be dispatched at the activeTarget
     *
     * By default a target does not accept this responsibility.
     */
    acceptsFocus: {
        value: false
    },

    /**
     * Whether or not this is the activeTarget
     */
    isActiveTarget: {
        get: function () {
            return this === defaultEventManager.activeTarget;
        }
    },

    /**
     * Which target to distribute an event after this when distributing events throughout a
     * graph of targets.
     */
    nextTarget: {
        value: null
    }
});
