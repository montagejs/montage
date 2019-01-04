var RawDataService = require("montage/data/service/raw-data-service").RawDataService;

exports.PlotSummaryService = RawDataService.specialize(/** @lends PlotSummaryService.prototype */ {

    fetchRawData: {
        value: function (stream) {
            this.addRawData(stream, [{
                summary: exports.PlotSummaryService.STAR_WARS_PLOT_SUMMARY
            }]);
            this.rawDataDone(stream);
        }
    }

}, {

    STAR_WARS_PLOT_SUMMARY: {
        value:  "The Imperial Forces -- under orders from cruel Darth Vader (David Prowse) -- " +
                "hold Princess Leia (Carrie Fisher) hostage, in their efforts to quell the " +
                "rebellion against the Galactic Empire. Luke Skywalker (Mark Hamill) and Han Solo " +
                "(Harrison Ford), captain of the Millennium Falcon, work together with the " +
                "companionable droid duo R2-D2 (Kenny Baker) and C-3PO (Anthony Daniels) to rescue " +
                "the beautiful princess, help the Rebel Alliance, and restore freedom and justice to " +
                "the Galaxy."
    }

});
