var Montage = require("montage").Montage;

/**
 * @class Movie
 * @extends Montage
 */
exports.Movie = Montage.specialize({

    /**
     * @type {boolean}
     */
    isFeatured: {
        value: undefined
    },

    /**
     * @type {PlotSummary}
     */
    plotSummary: {
        value: undefined
    },

    /**
     * @type {Date}
     */
    releaseDate: {
        value: undefined
    },

    /**
     * @type {string}
     */
    title: {
        value: undefined
    }

});
