var DataEditor = require("./data-editor").DataEditor;

/**
 * Instantiated with an ObjectDescriptor, this reusable component simplifies the display,
 * creation, edition and deletion of objects described by the object descriptor
 * and further described by a criteria. It's meant to be used as a source of data coming
 * from a data service, using query and a dataStream, as well as in a master-details wy
 * where a DataEditor could be assign the job of editing the relationship of an object
 * that's already in memory. However, even though that relationship is typically an array
 * if it has to many values, it shouldn't be fetched all in memory and we'll need a way to
 * move a cursor through that relationship as it is scrolled for example.
 *
 * It uses and cordinates the different roles of existing montage objects
 * like the rangeController, query, data stream etc...
 *
 * - track object changes to convey it to user, preferably using new event system:
 * - if target is an object, it bubbles to its objectDescriptor, the mainService and then
 *   the application.
 * - commnunicate data operations coming from the bottom of the stack such as:
 *      - validation errors when saving
 *      - updates coming from server if someone else made an update
 *      - re-authorozing if editing a sensitive aspect of t he object
 *
 * -
 *
 * @class DataObjectEditor
 * @extends DataEditor
 */
exports.DataObjectEditor = DataEditor.specialize(/** @lends DataEditor# */ {


});
