var Component = require("./component").Component,
Criteria = require("core/criteria").Criteria,
DataQuery = require("data/model/data-query").DataQuery,
DataStream = require("data/service/data-stream").DataStream,
ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
DataOrdering = require("data/model/data-ordering").DataOrdering,
Montage = require("core/core").Montage,
//UUID = require("core/uuid"),
ONE_WAY = "<-",
ONE_WAY_RIGHT = "->",
TWO_WAY = "<->";



/**
 * Instantiated with an ObjectDescriptor, this reusable component simplifies the display,
 * creation, edition and deletion of objects described by the object descriptor
 * and further described by a criteria. It's meant to be used as a source of data coming
 * from a data service, using query and a dataStream, as well as in a master-details wy
 * where a DataEditor could be assign the job of editing the relationship of an object
 * that's already in memory. However, even though that relationship is typically an array
 * if it has to many values, it shouldn't be fetched all in memory and we'll need a way to
 * move a cursor through that relationship as it is scrolled for example.
 *
 * It uses and cordinates the different roles of existing montage objects
 * like the rangeController, query, data stream etc...
 *
 * - track object changes to convey it to user, preferably using new event system:
 * - if target is an object, it bubbles to its objectDescriptor, the mainService and then
 *   the application.
 * - commnunicate data operations coming from the bottom of the stack such as:
 *      - validation errors when saving
 *      - updates coming from server if someone else made an update
 *      - re-authorozing if editing a sensitive aspect of t he object
 *
 * -
 *
 * @class DataEditor
 * @extends Component
 */

/*

    Modeling question: do we need a DataSreamController to do for a DataStream
    what the RangeController does for an array?
    Should there be a super class named CollectionController? Or DataController
    specialized in CollectionController and ObjectController?

*/



exports.DataEditor = Component.specialize(/** @lends DataEditor# */ {
    constructor: {
        value: function DataEditor () {
            this.super();
            // this.canDrawGate.setField("dataLoaded", false);
            // console.log("---------- "+this.constructor.name+" inDocument:"+this.inDocument+" —— dataLoaded: false",value);

            // this.addPathChangeListener(
            //     "data",
            //     this,
            //     "handleDataChange"
            // );

            return this;
        }
    },
    // defineBinding: {
    //     value: function (targetPath, descriptor, commonDescriptor) {
    //         var result = this.super(targetPath, descriptor, commonDescriptor),
    //             twoWay = TWO_WAY in descriptor,
    //             sourcePath = !twoWay ? descriptor[ONE_WAY] : descriptor[TWO_WAY] || "";

    //         // if(targetPath.startsWith("data") || sourcePath.indexOf(".data") !== -1) {
    //             // console.log(Object.keys(descriptor)[0]+" "+this.constructor.name+" has ["+targetPath+"] bound to ["+descriptor.sourcePath+"]"+", parentComponent:",this.parentComponent);
    //         // }
    //         return result;
    //     }
    // },

    /**
     * A DataService used to fetch data. By default uses application.mainService
     * But when we support nested editing context / data services, could be a
     * different one.
     *
     * @type {CollectionController}
     */
    _dataService: {
        value: undefined
    },

    dataService: {
        get: function() {
            return this._dataService || this.application.mainService;
        },
        set: function(value) {
            if(value !== t_dataService) {
                this._dataService = value;
            }
        }
    },

    __dataQuery: {
        value: undefined
    },

    _dataQuery: {
        get: function() {
            if(!this.__dataQuery) {
                if(this.type) {
                    this.__dataQuery = DataQuery.withTypeAndCriteria(this.type,this.criteria);
                    if(this.orderings) {
                        this.__dataQuery.orderings = this.orderings;
                    }
                    if(this.fetchLimit) {
                        this.__dataQuery.fetchLimit = this.fetchLimit;
                    }
                    if(this.readExpressions) {
                        this.__dataQuery.readExpressions = this.readExpressions;
                }

                }
            }
            return this.__dataQuery;
        }
    },


    /**
     * A timeout used to make sure that for any succesive
     *
     */

     /*
    _fetchDataTimeout: {
        value: false
    },

    __needsFetchData: {
        value: false
    },

    _needsFetchData: {
        get: function() {
            return this.__needsFetchData;
        },
        set: function(value) {
            if(value !== this.__needsFetchData) {

                if(value && !this.__needsFetchData) {
                    //Schedule fetchData
                    if(!this._fetchData) {
                        this._fetchData = this.fetchData.bind(this);
                    }
                    this._fetchDataTimeout = setTimeout(this._fetchData,0);
                }
                else {
                    //cancel Scheduled fetchData

                }
                this.__needsFetchData = value;
            }
        }
    },
    */

    /**
     * A DataEditor calls fetchData when what makes it's query changes:
     *      - type, criteria or data ordering.
     *
     */

    fetchData: {
        value: function() {

            if(this._dataQuery) {
                var dataService = this.dataService,
                    currentDataStream = this.dataStream,
                    dataStream,
                    self = this;
                //console.debug(this.constructor.name+" fetchData() >>>>> setField('dataLoaded', false)");
                this.canDrawGate.setField("dataLoaded", false);
                dataStream = dataService.fetchData(this._dataQuery);

                /*
                    Kinda funky to do it here, it might be better in the setter of dataLoadedPromise to do so?
                */
                this.dataLoadedPromise = dataStream;

                dataStream.then(function(data) {
                    //console.log("Data fetched:",data);
                    self.dataStream = dataStream;

                    //We need to
                    dataService.cancelDataStream(currentDataStream);

                    return data;
                },
                function(error) {
                    console.log("fetchData failed:",error);
                })
                .finally(() => {
                        // this.canDrawGate.setField("dataLoaded", true);
                });
            }
        }
    },

    dataDidChange: {
        value: function () {
        }
    },


    fetchDataIfNeeded: {
        value: function() {

                //Blow the cache:
                this.__dataQuery = null;

                //If we're active for trhe user, we re-fetch
                //if(this.inDocument && this._dataQuery) {
                if(this.isTemplateLoaded && this._dataQuery) {
                    this.fetchData();
                }
        }
    },

    // deserializedFromSerialization: {
    //     value: function (label) {
    //         this.super(label);
    //         console.log("deserializedFromSerialization("+label+")");
    //         //this.fetchData();
    //     }
    // },

    // deserializedFromTemplate: {
    //     value: function () {
    //         // this.fetchData();
    //         console.log("deserializedFromTemplate");
    //     }
    // },

    templateDidLoad: {
        value: function () {
            this.fetchDataIfNeeded();
        }
    },

    /**
     * The type of data object edited.
     *
     * @type {ObjectDescriptor}
     */
    _type: {
        value: undefined
    },
    type: {
        get: function() {
            return this._type;
        },
        set: function(value) {
            //console.log("set type ",value);
            if(!this._type || (this._type && this._type !== value)) {
                this._type = value;
                this.fetchDataIfNeeded();
            }
        }
    },
    /**
     * A Criteria narowing the instances of type that are displayed/edited.
     *
     * @type {CollectionController}
     */
    _criteria: {
        value: undefined
    },
    criteria: {
        get: function() {
            return this._criteria;
        },
        set: function(value) {
            if(value !== this._criteria) {
                this._criteria = value;
                this.fetchDataIfNeeded();
            }
        }
    },
    _orderings: {
        value: undefined
    },
    orderings: {
        get: function () {
            return this._orderings;
        },
        set: function (value) {
            if(value !== this._orderings) {
                this._orderings = value;
            }
        }
    },

    fetchLimit: {
        value: undefined
    },

    readExpressions: {
        value: undefined
    },

    /**
     * A RangeController, TreeController, or equivalent object that provides sorting, filtering,
     * selection handling of a collection of object.
     *
     * @type {CollectionController}
     */
    dataController: {
        value: undefined
    },

    /**
     * the DataStream carrying objects described by the current criteria.
     *
     * @type {DataStream}
     */
    _dataStream: {
        value: undefined
    },

    dataStream: {
        get: function() {
            return this._dataStream;
        },
        set: function(value) {
            if(value !== this._dataStream) {
                this._dataStream = value;
                this.data = this._dataStream.data;
            }
        }
    },

    /**
     * This is the property that makes the dataLoaded gate works hierarchically,
     * as long as nested DataEditors are capable of knowing when to signal that data is loaded.
     * If bindings in tenplates just do their thing organially, DataEditor component owner
     * is out of the loop, besides receiving ad. To know, he possibly could (we don't have a way for this right now):
     *      - listen somehow for the fact that a DataTrigger gets what's needed, in cascade....?
     *      DataTrigger/DataService could dispacth events when they're triggered? That's equivallent of using
     *      addPathChangeListener/addRangeAtPathChangeListener
     *
     *
     *      - figure out what property of chid components is bound to something off their data property, and observe that
     *          - (might need a new dataLoadedGate that combine into the canDraw-dataLoaded now),
     *          - and when the value is set ( null or otherwise) then flip the flag to true
     *          - that doesn't help load faster
     *          - that adds observing that has no other purpose than coordinating display
     *
     *      - If child component would setCanDraw dataLoaded false when they don't have data,
     *      like a text receiving set value of undefined when initially bound, which is a problem unsolved when
     *      components are used in a repetition. The ones in the template received bindings but are used as template
     *      and never received actual data that would unlock things.
     *
     * objectDescriptor's that's in dataMapping
     * as dataMapping.objectDescriptor.
     */


    _blocksOwnerComponentDraw: {
        value: true
    },

    _data: {
        value: undefined
    },
    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {

            if(value !== this._data) {
            /*
                By checking for readExpressions, we assess wether the DataEditor has everything it needs with it's data, or, if it has readExpressions, then it means it needs a subgraph off data.

                By default, the readExpressions are sent in the query, but some DataServices may not be able to satisfy them all in one-shot. If not, then the DataService should ideally be able to hide the multiple round-trips to one or more RawDataService(s) to get all readExpressions asked.

                The readExpressions should ideally be dynamically gathered from what components exressed they needs to display, which is typically expressed by binding their property, like "value" for Text, to expressions off the DataEditor's owner data property. This isn't done yet.

                For now, we don't have an easy way to know wether the query's readExpressions (this.readExpressions if any) have been fulfilled, so we don't tie that with the canDrawGate.
            */

            //Clear the cached promise from last data value
            this._dataLoadedPromise = null;
            this._data = value;

            var dataLoadedPromise = this.dataLoadedPromise;
            if(dataLoadedPromise) {
                this.canDrawGate.setField("dataLoaded", false);
                this._updateOwnerCanDrawGate();
                // console.debug("************** "+this.constructor.name+"["+Object.hash(this)+'].setField("dataLoaded", false)');
                // console.debug("************** "+this.constructor.name+"["+this.uuid+'].setField("dataLoaded", false)');
                dataLoadedPromise.then(() => {
                    this.canDrawGate.setField("dataLoaded", true);
                    // console.debug("************** "+this.constructor.name+"["+Object.hash(this)+'].setField("dataLoaded", true)');
                    this._updateOwnerCanDrawGate();
                });

            } else {
                this.canDrawGate.setField("dataLoaded", true);
            }

            this.dataDidChange(value);

            }
        }
    },
    _dataLoadedPromise: {
        value: undefined
    },
    dataLoadedPromise: {
        get: function() {
            return this._dataLoadedPromise || (this._dataLoadedPromise = this.initializeDataLoadedPromise());
        },
        set: function(value) {
            if(value !== this._dataLoadedPromise) {
                this._dataLoadedPromise = value;
            }
        }
    },

    initializeDataLoadedPromise: {
        value: function (data) {
        }
    },

    handleDataChange: {
        value: function (data) {

        }
    }


});


//Montage.defineUuidProperty(exports.DataEditor.prototype);
