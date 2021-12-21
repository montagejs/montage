var HttpService = require("./http-service").HttpService,
    DataQuery = require("../model/data-query").DataQuery,
    Enumeration = require("../model/enumeration").Enumeration,
    Map = require("../../core/collections/map"),
    // Montage = require("../../core/core").Montage,
    parse = require("../../core/frb/parse"),
    compile = require("../../core/frb/compile-evaluator"),
    evaluate = require("../../core/frb/evaluate"),
    Scope = require("../../core/frb/scope"),
    Promise = require("../../core/promise").Promise;


/**
 * Superclass for GraphQLService services communicating using HTTP, but also with push capable API for subscription feature
 *
 * @class
 */

 /* TODO:

 -  How to support the notion of implements / Interfaces / "Categories (in the objective-C sense"
    Basically an object descriptor implements a set of property descriptor and needs to be "adopted"
    by other objet descriptors such as the interface's property descriptors become available on the adopter.
    It should be fairly straightforwards to add an array of "interfaces", and when added we do what's needed.
    this exists in Shopify.
-   Needs the ability for queries to dynamically specify the properties of objects fetched that should be returned.
    Today there's a set of "prerequisite" properties, but we need to move to a system where properties dynamically
    requested by the user interface, through binding or programmatically created, can specify what is needed.
    For binding, a frequent pattern happens when displaying a list, triggering the same set of properties on each iteration.
    We need to be able group and batch the queries to resolve this more efficiently, which GraphQL is capable of.
-   We need to be able to automatically transform a query and it's criteria into a GraphQL query
-   we should be able to transform an existing GraphQL schema into a montage data one.
-   Some of Shopify objects have "methods", for example an Image has transformedSrc, whicj returns a URL and        take as argument:
        - crop (  CropRegion )	//Crops the image according to the specified region.
        - maxHeight (  Int )	//Image height in pixels between 1 and 5760.
        - maxWidth (  Int )	    //Image width in pixels between 1 and 5760.
        - preferredContentType (  ImageContentType )	//Best effort conversion of image into content type (SVG -> PNG, Anything -> JGP, Anything -> WEBP are supported).
        - scale (  Int )	    //Image size multiplier for high-resolution retina displays. Must be between 1 and 3. Default value: true

    The RemoteProcedureCall operation should be used to model this
- When we receive data back, the shape of the result is related to the shape of the query. One thing we're missing is going from the name of the objectdescriptor to the name used for expressing the query and the same one used for results.
- shopify/graphql-js-client/src/decode.js has an implementation that reads the structure.
- Shopify has 2 levels of API: storefront and admin, and  2 matching different authentication. Some API / properties of one object are only available through one API vs the other. This is going to require some changes? Or should there be 2 different dataServices?
 */

/*
 *
 * @extends HttpService
 */
var GraphQLService = exports.GraphQLService = HttpService.specialize(/** @lends GraphQLService.prototype */ {

    deserializeSelf: {
        value: function (deserializer) {
            var value, result;
            // console.log("AirtableService super deserialize #"+deserializeSelfCount);
            return this.super(deserializer);
        }
    }
});
