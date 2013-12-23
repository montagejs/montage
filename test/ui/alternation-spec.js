var Montage = require("montage").Montage,
    TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("alternation/alternation", function(testPage) {
    describe("ui/repetition-spec", function() {
        var eventManager,
            application,
            delegate;

        var querySelector = function(s) {
            return testPage.querySelector(s);
        };

        beforeEach(function () {
            application = testPage.window.document.application;
            eventManager = application.eventManager;
            delegate = application.delegate;
        });

        describe("switchPath property", function() {
            it("should only draw DOM elements that match switchPath", function() {
                var element = querySelector(".alternationSwitchPath");
                expect(element).toBeDefined();
                expect(element.textContent).toBe("PASS");
            });

            it("should iterate through content", function() {
                var admin = querySelector("#switch-path-admin");
                var user = querySelector("#switch-path-user");
                expect(admin.textContent).toBe("John");
                expect(user.textContent).toBe("Mary");
            });
        });


    });
});
