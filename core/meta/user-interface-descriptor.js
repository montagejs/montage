var Montage = require("../core").Montage;

/*

List of PropertyInterfaceDescriptors, to show in UI, if not there, it's not viewable
PropertyInspector:
ViewInspector
EditInspector

Javier: per object, a limited amount of metadata:
1 inspector, 1 creator, 1 inlineInspector,


Javier want to be able to define which columns should be used in a table, the ratio of sizes between columns, the sorted by defaults, the filter criteria, etc…

if a user resize a column, where does it get saved?
The table would ask the object what does it has for a table.

Needs groups of properties, like in blueprint

When serializing their states, a table view that is data driven, the user tweaks needs to be  stored by component unique id and by the type they displayed at the time of change
*/

/**
 * @class UserInterfaceDescriptor
 * @extends Montage
 */
exports.UserInterfaceDescriptor = Montage.specialize( /** @lends UserInterfaceDescriptor.prototype # */ {

    /**
     * The object a UserInterfaceDescriptor describes. This is intented be an ObjectDescriptor/blueprint or a PropertyDescriptor/PropertyBlueprint
     *
     * @type {object} descriptor
     */
    descriptor: {
        value: void 0
    },

    /**
     * An expression that enables a UserInterfaceDescriptor to get a display name from its describedObject.
     * Like "fullName" or firstName + " "+ lastName
     * @type {MontageExpression} nameExpression
     */
    nameExpression: {
        value: void 0
    },

    /**
     * An expression that enables a UserInterfaceDescriptor to get a short description from its describedObject.
     * @type {MontageExpression} descriptionExpression
     */
    descriptionExpression: {
        value: void 0
    },

    /**
    * An expression that enables a UserInterfaceDescriptor to get a collection display names from its describedObject.
     * Like "employees"
    * @type {MontageExpression} collectionNameExpression
    */
    collectionNameExpression: {
        value: void 0
    },

    /**
     * A component to be used to visually represent an object described by the descriptor
     *
     * @type {Component} iconComponentModule
     */
    iconComponentModule: {
        value: void 0
    },

    /**
     * A component to be used to create new objects as described by descriptor
     *
     * @type {Component} creatorComponentModule
     */
    creatorComponentModule: {
        value: void 0
    },

    /**
     * A component to be used to inspect an object described by descriptor
     *
     * @type {Component} inspectorComponentModule
     */
    inspectorComponentModule: {
        value: void 0
    },

    /**
     * A component to be used to edit descriptor's described object directly, over/around the object itself.
     * compared to the inspectorComponentModule that indirectly interact with the object.
     * This is especially relevant for authoring tools.
     *
     * @type {Component} editorComponentModule
     */
    editorComponentModule: {
        value: void 0
    },

    /**
     * A component to be used to inspect a collection of descriptor's described object
     *
     * @type {Component} collectionInspectorComponentModule
     */
    collectionInspectorComponentModule: {
        value: void 0
    },

    /**
     * A component to be used to edit a collection of descriptor's described object directly
     *
     * @type {Component} collectionEditorComponentModule
     */
    collectionEditorComponentModule: {
        value: void 0
    },

    /**
     * A component to be used to represent a single instance of descriptor's described object in a collection of described objects
     *
     * @type {Component} collectionItemComponentModule
     */
    collectionItemComponentModule: {
        value: void 0
    },

    /**
     * An array of UserInterfaceDescriptors that individually describe the PropertyDescriptors/PropertyBlueprints of this object's descriptor's PropertyDescriptors
     * An ObjectDescriptor/Blueprint has groups of propery descriptors that should be respected in term of organization
     *
     * @type {Component} propertyUserInterfaceDescriptors
     */
    propertyUserInterfaceDescriptors: {
        value: void 0
    }

});
