var Montage = require("montage").Montage,
    Set = require("montage/collections/set"),
    UndoManager = require("montage/core/undo-manager").UndoManager,
    Promise = require("montage/core/promise").Promise;

var Roster = Montage.create(Montage, {

    didCreate: {
        value: function () {
            this._members = new Set();
        }
    },

    initWithUndoManager: {
        value: function (undoManager) {
            this._undoManager = undoManager;
            return this;
        }
    },

    _undoManager: {
        value: null
    },

    undoManager: {
        get: function () {
            return this._undoManager;
        }
    },

    _members: {
        value: null
    },

    members: {
        get: function () {
            return this._members
        }
    },

    //NOTE these APIs return the add promise to expose more testing surface area, this is not a demand of the undo system

    addMember: {
        value: function (member) {
            this.members.add(member);
            return this.undoManager.register("Add Member", Promise.resolve(["Add " + member, this.removeMember, this, member]));
        }
    },

    removeMember: {
        value: function (member) {
            this.members.delete(member);
            return this.undoManager.register("Remove Member", Promise.resolve(["Remove " + member, this.addMember, this, member]));
        }
    },

    testableAddMember: {
        value: function (member) {
            var deferredAdd = Promise.defer();

            this.members.add(member);

            this.undoManager.register("Add Member", deferredAdd.promise);

            return deferredAdd;
        }
    }
});

describe('core/undo-manager-spec', function () {

    var undoManager, roster;

    beforeEach(function () {
        undoManager = UndoManager.create();
        roster = Roster.create().initWithUndoManager(undoManager);
    });

    describe("initially", function () {
        it("must not have anything to undo", function () {
            expect(undoManager.canUndo).toBe(false);
        });

        it("must not have anything to redo", function () {
            expect(undoManager.canRedo).toBe(false);
        });

        it("must not be undoing", function () {
            expect(undoManager.isUndoing).toBe(false);
        });

        it("must not be redoing", function () {
            expect(undoManager.isRedoing).toBe(false);
        });
    });

    describe("max undo count functionality", function () {

        it("must not accept new undo entries when the max undo count is 0", function () {
            undoManager.maxUndoCount = 0;
            roster.addMember("Alice");

            expect(undoManager.canUndo).toBe(false);
        });


        it("must remove extra undo operations when the max undo count is reduced beyond the current count", function () {
            var aliceAddition =  roster.addMember("Alice"),
                bobAddition = roster.addMember("Bob");

            expect(undoManager.undoCount).toBe(2);

            return Promise.all([aliceAddition, bobAddition]).then(function () {
                undoManager.maxUndoCount = 1;
                expect(undoManager.canUndo).toBe(true);
                expect(undoManager.undoCount).toBe(1);
                expect(undoManager.undoLabel).toBe("Undo Add Bob");
            });
        });

        it("should not remove undo operations when the max undo count is changed above the current count", function () {
            roster.addMember("Alice");
            roster.addMember("Bob");

            expect(undoManager.undoCount).toBe(2);
            undoManager.maxUndoCount = 2;
            expect(undoManager.undoCount).toBe(2);
            undoManager.maxUndoCount = 10;
            expect(undoManager.undoCount).toBe(2);
        });

    });

    describe("registering operations", function () {

        it("should add to the undo stack when not undoing or redoing", function () {
            roster.addMember("Alice");

            expect(undoManager.undoCount).toBe(1);
            expect(undoManager.redoCount).toBe(0);
        });

        it("should add to the redo stack when undoing", function () {
            roster.addMember("Alice");

            return undoManager.undo().then(function () {
                expect(undoManager.undoCount).toBe(0);
                expect(undoManager.redoCount).toBe(1);
            });
        });

        it("should add to the undo stack when redoing", function () {
            roster.addMember("Alice");

            var undoThenRedoPromise = undoManager.undo().then(function () {
                return undoManager.redo();
            });

            return undoThenRedoPromise.then(function () {
                expect(undoManager.undoCount).toBe(1);
                expect(undoManager.redoCount).toBe(0);
            });
        });

        it("must reject adding non-promises", function () {
            expect(function () {
                expectundoManager.register("Something", function () {});
            }).toThrow();
        });

    });

    describe("performing an undo", function () {

        it("should not alter the initial label if no label is provided when resolving the operationPromise", function () {
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                entry = undoManager._promiseOperationMap.get(deferredAdditionUndo.promise);

            expect(entry.label).toBe("Add Member");

            deferredAdditionUndo.resolve([Function.noop, window, "Alice"]);

            deferredAdditionUndo.promise.then(function () {
                expect(entry.label).toBe("Add Member");
            });
        });

        it("should invoke the undo function with the expected parameters", function () {
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                spyObject = {
                    removeMember: function (member) {
                        expect(this).toBe(spyObject);
                        expect(member).toBe("Alice");
                    }
                };

            spyOn(spyObject, "removeMember").andCallThrough();
            deferredAdditionUndo.resolve(["Test Label", spyObject.removeMember, spyObject, "Alice"]);


            return undoManager.undo().then(function () {
                expect(spyObject.removeMember).toHaveBeenCalled();
            });
        });

        it("should properly invoke the undo function even if no label was provided when resolving the operationPromise", function () {
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                spyObject = {
                    removeMember: function (member) {
                        expect(this).toBe(spyObject);
                        expect(member).toBe("Alice");
                    }
                };

            spyOn(spyObject, "removeMember").andCallThrough();
            deferredAdditionUndo.resolve([spyObject.removeMember, spyObject, "Alice"]);


            return undoManager.undo().then(function () {
                expect(spyObject.removeMember).toHaveBeenCalled();
            });
        });

        it("should invoke the redo function with the expected parameters", function () {
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                spyObject = {
                    removeMember: function (member) {
                        undoManager.register("Spy: Add Member", Promise.resolve(["Spy Resolved Add Member", this.addMember, this, member]));
                    },
                    addMember: function (member) {
                        expect(this).toBe(spyObject);
                        expect(member).toBe("Alice");
                    }
                };

            deferredAdditionUndo.resolve(["Test Label", spyObject.removeMember, spyObject, "Alice"]);

            spyOn(spyObject, "addMember").andCallThrough();

            return undoManager.undo().then(function () {
                return undoManager.redo();
            }).then(function () {
                expect(spyObject.addMember).toHaveBeenCalled();
            });
        });

        it("should invoke multiple undos newest to oldest", function () {
            roster.addMember("Alice");
            roster.addMember("Bob");

            var bobUndo = undoManager.undo();
            var aliceUndo = undoManager.undo();

            return Promise.all([bobUndo, aliceUndo]).then(function () {
                expect(roster.members.length).toBe(0);
            });
        });

        it("should invoke multiple undos newest to oldest with interleaving undoable operations", function () {
            roster.addMember("Alice");

            roster.addMember("Bob");
            var bobUndo = undoManager.undo();

            roster.addMember("Carol");
            var carolUndo = undoManager.undo();

            return Promise.all([bobUndo, carolUndo]).then(function () {
                expect(roster.members.length).toBe(1);
                expect(roster.members.has("Alice")).toBe(true);
            });
        });

        it("should not be affected by multiple no-op undos", function () {
            roster.addMember("Alice");

            return Promise.all([undoManager.undo(), undoManager.undo(), undoManager.undo()]).then(function () {
                expect(roster.members.length).toBe(0);
               return  undoManager.redo()
            }).then(function () {
                expect(roster.members.length).toBe(1);
                expect(roster.members.has("Alice")).toBe(true);
            });
        });

        it("should not be affected by multiple no-op redos", function () {
            roster.addMember("Alice");

            return undoManager.undo().then(function () {
                expect(roster.members.length).toBe(0);
                return Promise.all([undoManager.redo(), undoManager.redo(), undoManager.redo()])
                    .then(function () {
                        expect(roster.members.length).toBe(1);
                        expect(roster.members.has("Alice")).toBe(true);
                        return undoManager.undo()
                    });
            }).then(function () {
                expect(roster.members.length).toBe(0);
            });
        });

    });

});
