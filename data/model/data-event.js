var MutableEvent = require("../../core/event/mutable-event").MutableEvent;

/**
 *
 * DataEvents:
 *
 * - the target is an objectDescriptor
 *
 *  A DataService facilitates events sent by DataObjects (DOs) at key points in their life cycle:
 *  - create: A DO has been created.
 *  - editstart: User has started to edit a DO.
 *  - edit: A DO has been modifed by the user. Sent when the first change is made from a saved/stable state.
 *  - change: A DO's property has been changed by the user. This isn't unique to DOs and happing in montage on-demand, and part of biding infrastructure.
 *  - update: A local DO's property has been changed, and saved, by another user, pushed by the server side.
 *  - editcancel: User stopped editing a A DataObject (DO) without saving the changes (this would ends up sending a revert as
 *  an object should never leave an editing state without a clear decision about changes made? What about if offline?)
 *  - editend: User has stopped editing a DataObject (DO) ?
 *  - revert: A DataObject's (DO) state has been returned to it's most recent state. / reset?
 *  - validate
 *  - validateerror
 *  - save: A DataObject's (DO) changes have been saved.
 *  - saveerror: A DataObject's (DO) changes have been saved.
 *  - delete: A DataObject's (DO) has been deleted.
 *  - deleteerror: A DataObject's (DO) has been deleted.
 *
 */

exports.DataEvent = MutableEvent.specialize({

    bubbles: {
        value: true
    },

    constructor: {
        value: function (type) {
            this.timeStamp = performance.now();
        }
    },

    /**
     * the dataService handling the event's target, which is a Data Object (DO)
     *
     * @type {DataService}
     */
    dataService: {
        value: true
    },

    /**
     * the ObjectDescriptor of the event's target, which is Data Object (DO)
     *
     * @type {ObjectDescriptor}
     */

    dataObject: {
        value: undefined
    },

    detail: {
        value: undefined
    }


}, {
    invalid: {
        value: "invalid"
    },

   create: {
        value: "create"
    },

    save: {
        value: "save"
    },

    delete: {
        value: "delete"
    },

    revert: {
        value: "revert"
    },

    /* when a change was made by someone else and it's making it's way to another user. */
    update: {
        value: "update"
    },

    saveChangesProgress: {
        value: "saveChangesProgress"
    }

});
