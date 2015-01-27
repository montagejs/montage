"use strict";

var Component = require("ui/component").Component;

exports.Main = Component.specialize({
    handleAction: {
        value: function (event) {
            console.log("heard");
            if (event.detail) {
                this.currentSegment = event.detail.get('data').label;
            }
        }
    },

    /**
     * Data can be any Object[] with any Object structure,
     * developer will pick right key by binding desired FRB expression.
     */
    data: {
        value: [
            {"region": "region1", "size": 10, "flag": true},
            {"region": "region2", "size": 10, "flag": true},
            {"region": "region3", "size": 10, "flag": true},
            {"region": "region4", "size": 10, "flag": true},
            {"region": "region5", "size": 10, "flag": true},
            {"region": "region6", "size": 50, "flag": true}
        ]
    },

    tree: {
        value: {
            region: "North America",
            size: 40,
            regions: [
                {
                    region: "Canada",
                    size: 20
                },
                {
                    region: "United States",
                    size: 20,
                    regions: [
                        {
                            region: "CA",
                            size: 40
                        },
                        {
                            region: "MN",
                            size: 30
                        }
                    ]
                }
            ]
        }
    }
});
