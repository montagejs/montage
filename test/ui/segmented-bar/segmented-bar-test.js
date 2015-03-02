"use strict";

var TestController = require("montage-testing/test-controller").TestController;

exports.SegmentedBarTest = TestController.specialize({
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
