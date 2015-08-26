"use strict";

/**
 * @module "montage/ui/succession.reel"
 */
var Component = require("ui/component").Component;
var WeakMap = require("collections/weak-map");

/**
 * Subclasses Component for its `domContent` behavior.
 *
 * If passage properties are defined on the Succession, they will override children's.
 * See {@link Succession#_prepareForBuild}.
 *
 * @class Succession
 * @augments Component
 */
exports.Succession = Component.specialize(/** @lends Succession.prototype */{
    /**
     * Overrides content's `buildInCssClass`.
     *
     * @see Component#buildInCssClass
     */
    contentBuildInCssClass: {value: undefined},

    /**
     * Overrides content's `buildInTransitionCssClass`.
     *
     * @see Component#buildInTransitionCssClass
     */
    contentBuildInTransitionCssClass: {value: undefined},

    /**
     * Overrides content's `buildOutCssClass`.
     *
     * @see Component#buildOutCssClass
     */
    contentBuildOutCssClass: {value: undefined},

    constructor: {
        value: function () {
            this.defineBindings({
                /**
                 * The top Passage of the Succession stack.
                 * It is coerce to `null` as `undefined` causes issues with `Slot`.
                 *
                 * @property {Passage} top
                 * @readonly
                 * @namespace Succession
                 */
                "top": {"<-": "this.content[this.content.length - 1]"},
                /**
                 * The Passage immediately below the top of Succession stack.
                 *
                 * @property {Passage} previous
                 * @readonly
                 * @namespace Succession
                 */
                "previous": {"<-": "this.content[this.content.length - 2]"},
                /**
                 * The beginning Passage of the Succession stack.
                 *
                 * @property {Passage} first
                 * @readonly
                 * @namespace Succession
                 */
                "first": {"<-": "this.content[0]"}
            });

            //this._backupTransitionProperties = new WeakMap();
        }
    },

    _content: {
        value: null
    },

    /**
     * A stack consisted of {@link Passage}s.
     *
     * @property {Array}
     */
    content: {
        get: function () {
            return this._content || (this._content = []);
        },
        set: function (value) {
            if (this.content && this.content.length) {
                this._prepareForBuild();
                this.domContent = null;
                //for (var i = 0; i < this.content.length; i++) {
                //    this._restoreBackupTransitionProperties(this.content[i]);
                //}
                this.content.length = 0;
            }

            if (value) {
                this.push(value);
            }
        }
    },

    /**
     * @property {boolean}
     * @default false
     */
    hasTemplate: {
        enumerable: false,
        value: false
    },

    /**
     * Push a new Passage onto the Stack.
     * If a Component is supplied, a Passage will be created based on what's currently on the stack.
     *
     * @function
     * @param {Passage|Component} value
     */
    push: {
        value: function (value) {
            var element;

            // Push may happen when Succession hasn't enterDocument yet
            if (this.parentComponent) {
                this._prepareForBuild(value);
            }

            this.content.push(value);

            // update DOM content
            if (!this.top.element) {
                element = document.createElement("div");
                element.id = this.top.identifier || "appendDiv";
                this.top.element = element;

            } else {
                element = this.top.element;
            }

            this.domContent = element;
            this.top.needsDraw = true;
        }
    },

    /**
     * Pop off the topmost Passage on the Stack.
     *
     * @function
     */
    pop: {
        value: function () {
            if (this.top) {
                var restore = this.top;

                this._prepareForBuild(this.previous);
                this.content.pop();

                if (this.content.length) {
                    this.domContent = this.top.element;
                    this.top.needsDraw = true;

                } else {
                    this.domContent = null;
                }

                // restore original passage properties now that component has left the stack
                //this._restoreBackupTransitionProperties(restore);
            }
        }
    },

    /**
     * A map of component's UUIDs and their original passage properties,
     * used to restore any overridden properties when components leave the stack.
     *
     * Each component's backup will only be set once, and will always contain component's
     * original passage properties.
     *
     * @property {WeakMap}
     */
    //_backupTransitionProperties: {
    //    value: null
    //},

    /**
     * Override build-in / out animation; checks for whether properties are undefined,
     * as null is used to disable passage animation.
     *
     * Priority from most important: Succession -> Passage -> Component
     *
     * @function
     * @private
     */
    _prepareForBuild: {
        value: function (incoming) {
            var outgoingBackup, incomingBackup,
                buildInCssClassOverride, buildInTransitionCssClassOverride, buildOutCSSClassOverride;

            if (incoming) {
                // Backup properties to be restored when components leave the Succession stack
                //if (!this._backupTransitionProperties.has(incoming)) {
                //    incomingBackup = {
                //        buildInCssClass: incoming.buildInCssClass,
                //        buildInTransitionCssClass: incoming.buildInTransitionCssClass,
                //        buildOutCssClass: incoming.buildOutCssClass
                //    };
                //
                //    this._backupTransitionProperties.set(incoming, incomingBackup);
                //}

                //if (!incomingBackup.buildInCssClass) {
                //    incomingBackup.buildInCssClass = incoming.buildInCssClass;
                //}
                //
                //if (!incomingBackup.buildInTransitionCssClass) {
                //    incomingBackup.buildInTransitionCssClass = incoming.buildInTransitionCssClass;
                //}
                //
                //buildInCssClassOverride = this.contentBuildInCssClass || incoming.buildInCssClass;
                //
                //// If this.contentBuildInCssClass is defined, this.contentBuildInTransitionCssClass may be undefined,
                //// but still need to override passage.buildInTransitionCssClass because we may want an animation
                //buildInTransitionCssClassOverride = this.contentBuildInCssClass ?
                //    this.contentBuildInTransitionCssClass : incoming.buildInTransitionCssClass;

                if (typeof this.contentBuildInCssClass !== 'undefined' &&
                    incoming.buildInCssClassOverride !== this.contentBuildInCssClass) {

                    incoming.buildInCssClassOverride = this.contentBuildInCssClass;

                    // buildInTransitionCssClass shouldn't be overridden if buildInCssClass wasn't overridden
                    // not checking undefined b/c we may desire CSS animation instead of transition
                    if (incoming.buildInTransitionCssClassOverride !== this.contentBuildInTransitionCssClass) {
                        incoming.buildInTransitionCssClassOverride = this.contentBuildInTransitionCssClass;
                    }
                }
            }

            if (this.top) { // outgoing
                if (typeof this.contentBuildOutCssClass !== 'undefined' &&
                    this.top.buildOutCssClassOverride !== this.contentBuildOutCssClass) {
                    this.top.buildOutCssClassOverride = this.contentBuildOutCssClass;
                }
            }
        }
    }

    /**
     * @function
     * @private
     */
    //_restoreBackupTransitionProperties: {
    //    value: function (component) {
    //        var backup = this._backupTransitionProperties.get(component);
    //
    //        if (backup) {
    //            if (backup.buildOutCssClass) {
    //                component.buildOutCssClass = backup.buildOutCssClass;
    //            }
    //
    //            if (backup.buildInCssClass) {
    //                component.buildInCssClass = backup.buildInCssClass;
    //            }
    //
    //            if (backup.buildInTransitionCssClass) {
    //                component.buildInTransitionCssClass = backup.buildInTransitionCssClass;
    //            }
    //
    //            this._backupTransitionProperties.delete(component)
    //        }
    //    }
    //}
});
