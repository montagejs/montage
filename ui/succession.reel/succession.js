"use strict";

/**
 * @module "montage/ui/succession.reel"
 */
var Component = require("ui/component").Component,
    Passage = require("ui/passage").Passage;

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
            this._clear();
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
            var passage, element;

            if (this.top && (value instanceof Passage)) {
                if ((value.source || value) !== this.top.destination) {
                    console.error(
                        new Error("Passage source isn't what's currently on the top of the " +
                        "Succession stack. Abandoning passage.")
                    );
                    return;
                }
            }

            // if pushing Component, generate a Passage
            if (!(value instanceof Passage)) {
                passage = new Passage();
                passage.source = this.top ? this.top.destination : null;
                passage.destination = value;
            } else {
                passage = value;
            }

            // Push may happen when Succession hasn't enterDocument yet
            if (this.parentComponent) {
                this._prepareForBuild(passage);
            }

            this._handleData(passage);

            this.content.push(passage);

            // update DOM content
            if (!this.top.destination.element) {
                element = document.createElement("div");
                element.id = this.top.destination.identifier || "appendDiv";
                this.top.destination.element = element;

            } else {
                element = this.top.destination.element;
            }

            this.domContent = element;
            this.top.destination.needsDraw = true;
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
                var restore = this.top.destination;

                this._swapSourceDestination(this.top);
                this._prepareForBuild(this.top);
                this.content.pop();

                if (this.content.length) {
                    this.domContent = this.top.destination.element;
                    this.top.destination.needsDraw = true;

                } else {
                    this.domContent = null;
                }

                // restore original passage properties now that component has left the stack
                this._restoreBackupTransitionProperties(restore);
            }
        }
    },

    /**
     * Clear the Stack of Transitions.
     *
     * @function
     * @private
     */
    _clear: {
        value: function () {
            if (this.content && this.content.length) {
                this._swapSourceDestination(this.top);
                this._prepareForBuild(this.top);
                this.content.length = 0;
                this.domContent = null;
            }
        }
    },

    /**
     * Flip source / destination to flip animation overriding in _prepareForBuild
     *
     * @function
     * @private
     */
    _swapSourceDestination: {
        value: function (passage) {
            var temp = passage.source;
            passage.source = passage.destination;
            passage.destination = temp;
        }
    },

    /**
     * A map of component's UUIDs and their original passage properties,
     * used to restore any overridden properties when components leave the stack.
     *
     * Each component's backup will only be set once, and will always contain component's
     * original passage properties.
     *
     * @property {Object}
     */
    _backupTransitionProperties: {
        value: {}
    },

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
        value: function (passage) {
            var source,
                sourceBackup, destinationBackup,
                buildInCssClassOverride, buildInTransitionCssClassOverride, buildOutCSSClassOverride;

            if (passage.destination) {
                // Backup properties to be restored when components leave the Succession stack
                destinationBackup = this._backupTransitionProperties[passage.destination.uuid] =
                    this._backupTransitionProperties[passage.destination.uuid] || {};

                if (!destinationBackup.buildInCssClass) {
                    destinationBackup.buildInCssClass = passage.destination.buildInCssClass;
                }

                if (!destinationBackup.buildInTransitionCssClass) {
                    destinationBackup.buildInTransitionCssClass = passage.destination.buildInTransitionCssClass;
                }

                buildInCssClassOverride = this.contentBuildInCssClass || passage.buildInCssClass;

                // If this.contentBuildInCssClass is defined, this.contentBuildInTransitionCssClass may be undefined,
                // but still need to override passage.buildInTransitionCssClass because we may want an animation
                buildInTransitionCssClassOverride = this.contentBuildInCssClass ?
                    this.contentBuildInTransitionCssClass : passage.buildInTransitionCssClass;

                if (typeof buildInCssClassOverride !== 'undefined' &&
                    passage.destination.buildInCssClass !== buildInCssClassOverride) {

                    passage.destination.buildInCssClass = buildInCssClassOverride;

                    // buildInTransitionCssClass shouldn't overridden if buildInCssClass wasn't overridden
                    if (passage.destination.buildInTransitionCssClass !== buildInTransitionCssClassOverride) {
                        passage.destination.buildInTransitionCssClass = buildInTransitionCssClassOverride;
                    }
                }
            }

            if (passage.source) {
                // Backup properties to be restored when components leave the Succession stack
                sourceBackup = this._backupTransitionProperties[passage.source.uuid] =
                    this._backupTransitionProperties[passage.source.uuid] || {};

                if (!sourceBackup.buildOutCssClass) {
                    sourceBackup.buildOutCssClass = passage.source.buildOutCssClass;
                }

                buildOutCSSClassOverride = this.contentBuildOutCssClass || passage.buildOutCssClass;

                if (typeof buildOutCSSClassOverride !== 'undefined' &&
                    passage.source.buildOutCssClass !== buildOutCSSClassOverride) {
                    passage.source.buildOutCssClass = buildOutCSSClassOverride;
                }
            }
        }
    },

    /**
     * Allow passage source to pass data to destination if desired.
     *
     * @private
     * @function
     */
    _handleData: {
        value: function (passage) {
            if (passage.sourceData) {
                passage.destinationData = passage.sourceData;
            }
        }
    },

    /**
     * @function
     * @private
     */
    _restoreBackupTransitionProperties: {
        value: function (component) {
            var backup = this._backupTransitionProperties[component.uuid];

            if (backup.buildOutCssClass) {
                component.buildOutCssClass = backup.buildOutCssClass;
                backup.buildOutCssClass = null;
            }

            if (backup.buildInCssClass) {
                component.buildInCssClass = backup.buildInCssClass;
                backup.buildInCssClass = null;
            }

            if (backup.buildInTransitionCssClass) {
                component.buildInTransitionCssClass = backup.buildInTransitionCssClass;
                backup.buildInTransitionCssClass = null;
            }

        }
    }
});
