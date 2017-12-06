var Movie = require("spec/data/logic/model/movie").Movie;

/**
 * @class ActionMovie
 * @extends Movie
 */
exports.ActionMovie = Movie.specialize({

    rating: {
        value: undefined
    },

    countries: {
        value: undefined
    }
    
});
