var Component = require("./component").Component,
Criteria = require("core/criteria").Criteria,
DataQuery = require("data/model/data-query").DataQuery,
DataStream = require("data/service/data-stream").DataStream,
ObjectDescriptor = require("core/meta/object-descriptor").ObjectDescriptor,
DataOrdering = require("data/model/data-ordering").DataOrdering;


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
            this.canDrawGate.setField("dataLoaded", false);
            // console.log("---------- "+this.constructor.name+" inDocument:"+this.inDocument+" —— dataLoaded: false",value);

            return this;
        }
    },
    defineBinding: {
        value: function (targetPath, descriptor, commonDescriptor) {
            var result = this.super(targetPath, descriptor, commonDescriptor);

            if(targetPath.startsWith("data")) {
                console.log(this.constructor.name+" has ["+targetPath+"] bound to ["+descriptor.sourcePath+"]"+", parentComponent:",this.parentComponent);
            }
            return result;
        }
    },

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
                    //console.log(this.constructor.name+" fetchData() >>>>> ");
                dataStream = dataService.fetchData(this._dataQuery);
                dataStream.then(function(data) {
                    //console.log("Data fetched:",data);
                    self.dataStream = dataStream;

                    //We need to
                    dataService.cancelDataStream(currentDataStream);

                        self.didFetchData(data);

                },
                function(error) {
                    console.log("fetchData failed:",error);
                })
                .finally(() => {
                        this.canDrawGate.setField("dataLoaded", true);
                });
            }
        }
    },

    didFetchData: {
        value: function (data) {
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

    _data: {
        value: undefined
    },
    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {
            // console.log(this.constructor.name+ " set data:",value, " inDocument:"+this.inDocument+", parentComponent:",this.parentComponent);
            if(this._data === undefined && value !== undefined) {
                // console.log("++++++++++ "+this.constructor.name+" inDocument:"+this.inDocument+" —— dataLoaded: true",value);
                this.canDrawGate.setField("dataLoaded", true);
            }
            if(value !== this._data) {
                this._data = value;
            }
        }
    }


});
