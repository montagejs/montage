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
     * A component to be used to visually represent an object described by the descriptor
     *
     * @type {Component} iconComponent
     */
    iconComponent: {
        value: void 0
    },


    /**
     * A component to be used to create new objects as described by descriptor
     *
     * @type {Component} creatorComponent
     */
    creatorComponent: {
        value: void 0
    },

    /**
     * A component to be used to inspect an object described by descriptor
     *
     * @type {Component} inspectorComponent
     */
    inspectorComponent: {
        value: void 0
    },

    /**
     * A component to be used to edit descriptor's described object directly, over/around the object itself.
     * compared to the inspectorComponent that indirectly interact with the object.
     * This is especially relevant for authoring tools.
     *
     * @type {Component} editorComponent
     */
    editorComponent: {
        value: void 0
    },

    /**
     * A component to be used to inspect a collection of descriptor's described object
     *
     * @type {Component} collectionInspectorComponent
     */
    collectionInspectorComponent: {
        value: void 0
    },

    /**
     * A component to be used to represent a single instance of descriptor's described object in a collection of described objects
     *
     * @type {Component} collectionItemComponent
     */
    collectionItemComponent: {
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
