var Montage = require("montage").Montage,
    Set = require("montage/collections/set"),
    UndoManager = require("montage/core/undo-manager").UndoManager,
    Promise = require("montage/core/promise").Promise,
    WAITS_FOR_TIMEOUT = 2500;

var Roster = Montage.specialize( {

    constructor: {
        value: function () {
            this._members = [];
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
            return this._members;
        }
    },

    //NOTE these APIs return the add promise to expose more testing surface area, this is not a demand of the undo system

    addMember: {
        value: function (member, position) {
            position = position || this.members.length;
            this._members.splice(position, 0, member);
            return this.undoManager.register("Add " + member, Promise.resolve([this.removeMember, this, member]));
        }
    },

    removeMember: {
        value: function (member) {
            var index = this._members.indexOf(member);
            if (index !== -1) {
                this._members.splice(index, 1);

                var foo = this.undoManager.register("Remove " + member, Promise.resolve([this.addMember, this, member, index]));
                foo.memberName = member;
                return foo;
            } else {
                return Promise.resolve();
            }

        }
    },

    removeAllMembers: {
        value: function () {

            this.undoManager.openBatch("Remove All Members");

            while (this._members.length) {
                this.removeMember(this._members[this._members.length - 1]);
            }

            this.undoManager.closeBatch();
        }
    },

    replaceAllMembers: {
        value: function () {

            this.undoManager.openBatch("Replace All Members");

            this.removeAllMembers();
            this.addMember("Replacement")

            this.undoManager.closeBatch();
        }
    },

    testableAddMember: {
        value: function (member) {
            var deferredAddResolve,
                deferredAdd = new Promise(function(resolve, reject) {
                    deferredAddResolve = resolve;
                });
            deferredAdd.resolve = deferredAddResolve;
            
            this.members.add(member);
            
            this.undoManager.register("Add Member", deferredAdd);

            return deferredAdd;
        }
    }
});

var Text = Montage.specialize({
    initWithUndoManager: {
        value: function (undoManager) {
            this.undoManager = undoManager;
            return this;
        }
    },

    text: {
        value: "abc"
    },

    del: {
        value: function (isSlow) {
            var self = this;
            var promise = Promise.resolve();
            if(isSlow) {
                promise.delay(20);
            }
            promise = promise.then(function () {
                var c = self.text.charAt(self.text.length - 1);
                self.text = self.text.substring(0, self.text.length - 1);

                return [self.add, self, c, isSlow];
            });

            return self.undoManager.register("Delete character", promise);
        }
    },

    add: {
        value: function (c, isSlow) {
            var self = this;
            var promise = isSlow ? Promise.delay(20) : Promise.resolve();

            promise = promise.then(function () {
                self.text += c;

                return [self.del, self, isSlow];
            });

            return self.undoManager.register("Add character", promise);
        }
    }
});

describe('core/undo-manager-spec', function () {

    var undoManager, roster;

    beforeEach(function () {
        undoManager = new UndoManager();
        roster = new Roster().initWithUndoManager(undoManager);
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
                expect(undoManager.undoLabel).toBe("Add Bob");
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

        it("must not register operations when registration is disabled", function () {
            undoManager.registrationEnabled = false;
            roster.addMember("Alice");

            expect(undoManager.undoCount).toBe(0);
        });

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
                undoManager.register("Something", function () {});
            }).toThrow();
        });

        it("must reject if no undo function was given", function () {
            return undoManager.register("Something", Promise.resolve([]))
            .then(function () {
                throw new Error("should be rejected");
            }, function (error) {
                expect(error.message).toBe("Need undo function for 'Something' operation, not: undefined");
            });
        });

    });

    describe("performing an undo", function () {

        it("should not alter the initial label if no label is provided when resolving the operationPromise", function () {
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                entry = undoManager._promiseOperationMap.get(deferredAdditionUndo);

            expect(entry.label).toBe("Add Member");

            deferredAdditionUndo.resolve([Function.noop, window, "Alice"]);

            deferredAdditionUndo.then(function () {
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
                return undoManager.redo();
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
                        return undoManager.undo();
                    });
            }).then(function () {
                expect(roster.members.length).toBe(0);
            });
        });

        it("should correctly reject an exceptional undo operation", function () {
            var error = new Error("Undo Operation Exception");
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                spyObject = {
                    removeMember: function (member) {
                        throw error;
                    }
                };

            spyOn(spyObject, "removeMember").andCallThrough();
            deferredAdditionUndo.resolve(["Test Label", spyObject.removeMember, spyObject, "Alice"]);

            return undoManager.undo().caught(function (failure) {
                expect(spyObject.removeMember).toHaveBeenCalled();
                expect(failure).toBe(error);
            }).timeout(WAITS_FOR_TIMEOUT);
        });

        it("should report the expected undoLabel while in the middle of undoing", function () {
            var deferredAdditionUndo = roster.testableAddMember("Alice"),
                spyObject = {
                    removeMember: function (member) {
                        expect(undoManager.undoLabel).toBe("Test Label");
                    }
                };

            spyOn(spyObject, "removeMember").andCallThrough();
            deferredAdditionUndo.resolve(["Test Label", spyObject.removeMember, spyObject, "Alice"]);

            return undoManager.undo().then(function (success) {
                expect(spyObject.removeMember).toHaveBeenCalled();
            }).timeout(WAITS_FOR_TIMEOUT);
        });

        it("maintains order when an operation is a long running async operation", function () {
            var text = new Text().initWithUndoManager(undoManager);

            text.del(true);//abc -> ab
            text.del(false);//ab->a

            undoManager.undo();//a->ab
            return undoManager.undo().then(function () {//ab->abc then
                expect(text.text).toBe("abc");
            });
        });

    });

    describe("batch operations", function () {

        beforeEach(function () {
            roster._members = ["Alice", "Bob", "Carol"];
        });

        describe("registration", function () {

            it("should consider multiple undo registrations within a single batch as a single undo operation", function () {
                roster.removeAllMembers();
                expect(undoManager.undoCount).toBe(1);
                expect(undoManager.undoLabel).toBe("Remove All Members");
            });

        });

        describe("undoing", function () {

            it("should perform all undo operations within the batch operation", function () {
                roster.removeAllMembers();
                return undoManager.undo().then(function () {
                    expect(roster.members.length).toBe(3);
                    expect(roster.members[0]).toBe('Alice');
                    expect(roster.members[1]).toBe('Bob');
                    expect(roster.members[2]).toBe('Carol');
                }).timeout(WAITS_FOR_TIMEOUT);
            });

            it("should perform the undos in the oposite order to the registrations", function () {
                undoManager.openBatch("Ordered removal");
                roster.removeMember('Carol');
                roster.removeMember('Bob');
                undoManager.closeBatch();

                return undoManager.undo().then(function () {
                    expect(roster.members.length).toBe(3);
                    expect(roster.members[0]).toBe('Alice');
                    expect(roster.members[1]).toBe('Bob');
                    expect(roster.members[2]).toBe('Carol');
                }).timeout(WAITS_FOR_TIMEOUT);
            });

        });

        describe("redoing", function () {

            it("should perform all redo operations within the batch operation", function () {
                roster.removeAllMembers();
                return undoManager.undo().then(function () {
                    return undoManager.redo();
                }).then(function () {
                    expect(roster.members.length).toBe(0);
                }).timeout(WAITS_FOR_TIMEOUT);
            });

            it("should perform all redo operations within a batch itself", function () {
                roster.removeAllMembers();
                return undoManager.undo().then(function () {
                    return undoManager.redo();
                }).then(function () {
                    expect(undoManager.undoCount).toBe(1);
                    expect(undoManager.redoCount).toBe(0);
                }).timeout(WAITS_FOR_TIMEOUT);
            });

        });

        it("maintains order when an operation is a long running async operation", function () {
            var text = new Text().initWithUndoManager(undoManager);

            undoManager.openBatch("Delete 2 characters");
            text.del(false);
            text.del(true);
            undoManager.closeBatch();

            return undoManager.undo().then(function () {
                expect(text.text).toBe("abc");
            });
        });

    });

    describe("nested batch operations", function () {

        beforeEach(function () {
            roster._members = ["Alice", "Bob", "Carol"];
        });

        describe("registration", function () {

            it("should consider multiple undo batch registrations within a single parent batch as a single undo operation", function () {
                roster.replaceAllMembers();
                expect(undoManager.undoCount).toBe(1);
                expect(undoManager.undoLabel).toBe("Replace All Members");
            });

        });

        describe("undoing", function () {

            it("should perform all undo batch operations within the parent batch operation", function () {
                roster.replaceAllMembers();
                return undoManager.undo().then(function () {
                    expect(roster.members.length).toBe(3);
                    expect(roster.members[0]).toBe('Alice');
                    expect(roster.members[1]).toBe('Bob');
                    expect(roster.members[2]).toBe('Carol');
                }).timeout(WAITS_FOR_TIMEOUT);
            });

        });

        describe("redoing", function () {

            it("should perform all batch redo operations within the parent batch operation", function () {
                roster.replaceAllMembers();
                return undoManager.undo().then(function () {
                    return undoManager.redo();
                }).then(function () {
                        expect(roster.members.length).toBe(1);
                        expect(roster.members[0]).toBe('Replacement');
                    }).timeout(WAITS_FOR_TIMEOUT);
            });

            it("should perform all redo operations within a batch itself", function () {
                roster.replaceAllMembers();
                return undoManager.undo().then(function () {
                    return undoManager.redo();
                }).then(function () {
                        expect(undoManager.undoCount).toBe(1);
                        expect(undoManager.redoCount).toBe(0);
                    }).timeout(WAITS_FOR_TIMEOUT);
            });

        });
    });

    describe("event", function () {
        var listener;

        beforeEach(function () {
            listener = {
                handleOperationRegistered: function () {},
                handleUndo: function () {},
                handleRedo: function () {}
            };
            undoManager.addEventListener("operationRegistered", listener, false);
            undoManager.addEventListener("undo", listener, false);
            undoManager.addEventListener("redo", listener, false);
        });

        it("operationRegistered is dispatched when an operation is added", function () {
            spyOn(listener, "handleOperationRegistered");

            return roster.addMember("Alice")
            .then(function () {
                expect(listener.handleOperationRegistered).toHaveBeenCalled();
            });
        });

        it("operationRegistered is not dispatched when an operation is added as a result of an undo", function () {
            return roster.addMember("Alice")
            .then(function () {
                spyOn(listener, "handleOperationRegistered");
                return undoManager.undo();
            })
            .then(function () {
                expect(listener.handleOperationRegistered).not.toHaveBeenCalled();
            });
        });

        it("undo is dispatched when an undo is performed", function () {
            return roster.addMember("Alice")
            .then(function () {
                spyOn(listener, "handleUndo");

                return undoManager.undo();
            })
            .then(function () {
                expect(listener.handleUndo).toHaveBeenCalled();
            });
        });

        it("redo is dispatched when a redo is performed", function () {
            return roster.addMember("Alice")
            .then(function () {
                return undoManager.undo();
            })
            .then(function () {
                spyOn(listener, "handleRedo");
                return undoManager.redo();
            })
            .then(function () {
                expect(listener.handleRedo).toHaveBeenCalled();
            });
        });
    });
});
