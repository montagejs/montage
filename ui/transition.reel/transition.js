"use strict";

/**
 * @module "montage/ui/transition.reel"
 */
var Montage = require("core/core").Montage;

/**
 * @class Transition
 * @extends Montage
 */
exports.Transition = Montage.specialize(/** @lends Transition.prototype */{
    /**
     * Use this to diffirentiate one type of transition from another.
     *
     * @property {String}
     */
    identifier: {value: null},

    /**
     * The component visible before the transition.
     *
     * @property {Component}
     */
    source: {value: null},

    /**
     * The component visible after the transition.
     *
     * @property {Component}
     */
    destination: {value: null},

    /**
     * @todo
     */
    buildInAnimation: {value: null},

    /**
     * @todo
     */
    buildOutAnimation: {value: null},

    /**
     * A CSS class that enables build-in CSS transition & animation.
     * This class is the starting point for CSS transition.
     * For CSS animation, it should contain all the start / end implementation.
     *
     * @property {String}
     */
    buildInCSSClassStart: {value: null},

    /**
     * A CSS class that marks the end of build-in CSS transition.
     * Use {@link Component.buildInCSSClassStart} for CSS animation.
     *
     * @property {String}
     */
    buildInCSSClassEnd: {value: null},

    /**
     * A CSS class that enables build-out CSS transition & animation.
     *
     * @property {String}
     */
    buildOutCSSClass: {value: null},

    /**
     * @property {*}
     */
    sourceData: {value: null},

    /**
     * @property {*}
     */
    destinationData: {value: null}
});
