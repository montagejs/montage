/**
 * @module montage/core/meta/user-interface-descriptor
 * @requires montage/core/core
 */

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
var UserInterfaceDescriptor = exports.UserInterfaceDescriptor = Montage.specialize( /** @lends UserInterfaceDescriptor.prototype # */ {
    /**
     * The object a UserInterfaceDescriptor describes. This would be an ObjectDescriptor/blueprint ot a PropertyDescriptor/PropertyBlueprint
     *
     * @returns {object} discribedObject
     */
    discribedObject/* or modelDescriptor ?*/: {
        value: void 0
    },

    /**
     * An expression that enables a UserInterfaceDescriptor to get a display name from its discribedObject.
     * Like "fullName" or firstName + " "+ lastName
     * @returns {MontageExpression} displayNameExpression
     */
    displayNameExpression: {
        value: void 0
    },

    /**
     * An expression that enables a UserInterface to get a display name from its discribedObject.
     *
     * @returns {Component} iconComponent
     */
    iconComponent: {
        value: void 0
    },


    /**
     * A component to be used to create new objects like discribedObject
     *
     * @returns {Component} creatorComponent
     */
    creatorComponent: {
        value: void 0
    },

    /**
     * A component to be used to inspect discribedObject
     *
     * @returns {Component} inspectorComponent
     */
    inspectorComponent: {
        value: void 0
    },

    /**
     * A component to be used to inspect discribedObject inline, over/around the object itself.
     * compared to in a separate area, which is handled by inspectorComponent.
     * This is especially relevant for authoring tools.
     *
     * @returns {Component} inspectorComponent
     */
    inlineIspectorComponent: {
        value: void 0
    },

    /**
     * A component to be used to inspect a collection of discribedObject
     *
     * @returns {Component} collectionComponent
     */
    collectionComponent: {
        value: void 0
    },

    /**
     * A component to be used to represent a single discribedObject in a collection of collection of discribedObject
     *
     * @returns {Component} collectionItemComponent
     */
    collectionItemComponent: {
        value: void 0
    },

    /**
     * An array of UserInterfaceDescriptors that describe the PropertyDescriptors/PropertyBlueprints of this object's discribedObject/modelDescriptor
     *
     * @returns {Component} collectionItemComponent
     */
    userInterfacePropertyDescriptors: {
        value: void 0
    }


});
