var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("custom-elements/custom-elements", function (testPage) {
    describe("montage-custom-element-spec", function () {
        var querySelector = function (s) {
            return testPage.querySelector(s);
        };
        var querySelectorAll = function (s) {
            return testPage.querySelectorAll(s);
        };

        describe('montage-text', function () {
            it("should be instantiated", function () {
                var textLabel1 = querySelector(".textLabel1");
                expect(textLabel1).toBeDefined();
                expect(textLabel1._instance).toBeDefined();
            });

            it("should set the property/attribute value", function () {
                var textLabel1 = querySelector(".textLabel1");
                expect(textLabel1.value).toBe('textLabel1');
                expect(textLabel1._instance.value).toBe('textLabel1');
                expect(textLabel1._instance.element.textContent).toBe('textLabel1');
                expect(textLabel1.getAttribute('value')).toBe('textLabel1');
            });

            it("should update the property/attribute value", function (done) {
                var textLabel1 = querySelector(".textLabel1");
                expect(textLabel1.value).toBe('textLabel1');
                textLabel1.value = 'quz';

                testPage.waitForComponentDraw(textLabel1._instance).then(function () {
                    expect(textLabel1.value).toBe('quz');
                    expect(textLabel1._instance.value).toBe('quz');
                    expect(textLabel1._instance.element.textContent).toBe('quz');
                    expect(textLabel1.getAttribute('value')).toBe('quz');

                    textLabel1.setAttribute('value', 'foo');

                    testPage.waitForComponentDraw(textLabel1._instance).then(function () {
                        expect(textLabel1.value).toBe('foo');
                        expect(textLabel1._instance.value).toBe('foo');
                        expect(textLabel1._instance.element.textContent).toBe('foo');
                        expect(textLabel1.getAttribute('value')).toBe('foo');

                        textLabel1._instance.value = 'bar';

                        testPage.waitForComponentDraw(textLabel1._instance).then(function () {
                            expect(textLabel1.value).toBe('bar');
                            expect(textLabel1._instance.value).toBe('bar');
                            expect(textLabel1._instance.element.textContent).toBe('bar');
                            expect(textLabel1.getAttribute('value')).toBe('bar');
                            done();
                        });  
                    });    
                });
            });

            it("property/attribute value should react to bindings", function (done) {
                var textLabel2 = querySelector(".textLabel2");
                var owner = textLabel2.owner;

                expect(textLabel2).toBeDefined();
                expect(textLabel2._instance).toBeDefined();
                expect(textLabel2.value).toBe('textLabel2');
                expect(textLabel2._instance.value).toBe('textLabel2');
                expect(textLabel2._instance.element.textContent).toBe('textLabel2');
                expect(textLabel2.getAttribute('value')).toBe('textLabel2');

                owner.textLabel2 = "foo";

                testPage.waitForComponentDraw(textLabel2._instance).then(function () {
                    expect(textLabel2.value).toBe('foo');
                    expect(textLabel2._instance.value).toBe('foo');
                    expect(textLabel2._instance.element.textContent).toBe('foo');
                    expect(textLabel2.getAttribute('value')).toBe('foo');
                    done();
                }); 
            });
        });

        describe('my-button', function () {
            it("should be instantiated", function () {
                var myButton = querySelector(".myButton");
                expect(myButton).toBeDefined();
                expect(myButton._instance).toBeDefined();
                expect(myButton._instance.label).toBe('click');
                expect(myButton._instance.element.textContent).toBe('click');
            });

        });
    });
});