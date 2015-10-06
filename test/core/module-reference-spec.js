/*global require,exports,describe,beforeEach,it,expect,waits,waitsFor,runs,spyOn */
var ModuleReference = require("montage/core/module-reference").ModuleReference;

describe("core/module-reference-spec", function () {
    var ref;
    beforeEach(function () {
        ref = new ModuleReference();
    });

    describe("init", function () {

        it("initializes id and require", function () {
            ref.initWithIdAndRequire("core/module-reference-spec", require);
            expect(ref.id).toBe("core/module-reference-spec");
            expect(ref.require).toBe(require);
        });

        it("throws if id is not given", function () {
            expect(function () {
                ref.initWithIdAndRequire(void 0, require);
            }).toThrow("Module ID and require required");
        });

        it("throws if require is not given", function () {
            expect(function () {
                ref.initWithIdAndRequire("core/module-reference-spec");
            }).toThrow("Module ID and require required");
        });

    });

    describe("exports", function () {

        it("returns a promise for the exports of the module", function () {
            ref.initWithIdAndRequire("core/module-reference-spec", require);
            return ref.exports.then(function (refExports) {
                expect(refExports).toBe(exports);
            });
        });

        it("loads the module lazily", function () {
            // prevent Mr regex from matching the require and preloading
            var r = require;

            ref.initWithIdAndRequire("non-existing-module", require);

            expect(function () {
                r("non-existing-module");
            }).toThrow('Can\'t require module "non-existing-module" via "core/module-reference-spec"');

            return ref.exports.catch(function (error) {
                try {
                    r("non-existing-module");
                    throw new Error("require didn't fail");
                } catch (e) {
                    // real error now that we have gone to the network
                    expect(e.message).toContain("because Can't XHR");
                }
            });
        });

    });

    describe("resolve", function () {

        it("returns a id for the module from a dependant package", function () {
            var montageRequire = require.getPackage({name: "montage"});
            ref.initWithIdAndRequire("core/module-reference", montageRequire);
            expect(ref.resolve(require)).toBe("montage/core/module-reference");
        });

    });

    describe("isModuleReference", function () {

        it("is true", function () {
            expect(ref.isModuleReference).toBe(true);
        });

        it("cannot be changed", function () {
            ref.isModuleReference = false;
            expect(ref.isModuleReference).toBe(true);
        });

    });

});
