"use strict";

/**
 * @module montage/ui/passage
 */
var Montage = require("core/core").Montage;

/**
 * @class Passage
 * @augments Montage
 */
exports.Passage = Montage.specialize(/** @lends Passage.prototype */{
    /**
     * Use this to diffirentiate one type of passage from another. For example, when there are
     * multiple ways to passage from the same source to the same destination,
     * such as 2 buttons that lead to 2 different setting screens, you can switch on this identifier.
     *
     * @name Component#identifier
     * @property {?String}
     */

    /**
     * The component visible before the passage.
     *
     * @property {?Component}
     */
    source: {value: null},

    /**
     * The component visible after the passage.
     *
     * @property {?Component}
     */
    destination: {value: null},

    /**
     * @inheritdoc Component#buildInCssClass
     */
    buildInCssClass: {value: undefined},

    /**
     * @inheritdoc Component#buildInTransitionCssClass
     */
    buildInTransitionCssClass: {value: undefined},

    /**
     * @inheritdoc Component#buildOutCssClass
     */
    buildOutCssClass: {value: undefined},

    /**
     * @property {*}
     */
    sourceData: {value: null},

    /**
     * @property {*}
     */
    destinationData: {value: null}
});
