/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var TransactionId = require("montage/data/transaction-id").TransactionId;
var TransactionManager = require("montage/data/transaction-id").TransactionManager;
var logger = require("montage/core/logger").logger("transactionmanager-spec");

describe("data/transactionmanager-spec",
    function () {
        describe("Creation of Transaction ID",
            function () {
                it("with factory",
                    function () {
                        var id = TransactionId.create().initWithMappingFolderName("folder");

                        // expect(id).toBe("manager.name");
                    });

                it("in sequential order and check of before function",
                    function () {
                        var id1 = TransactionId.create().initWithMappingFolderName("folder");
                        var id2 = TransactionId.create().initWithMappingFolderName("folder");

                        expect(id1.before(id2)).toBe(true);
                        expect(id2.before(id1)).toBe(false);
                    });

                it("in sequential order and check of after function",
                    function () {
                        var id1 = TransactionId.create().initWithMappingFolderName("folder");
                        var id2 = TransactionId.create().initWithMappingFolderName("folder");

                        expect(id1.after(id2)).toBe(false);
                        expect(id2.after(id1)).toBe(true);
                    });
            });
        describe("Creation of Transaction Manager",
            function () {
                it("singleton",
                    function () {
                        var manager = TransactionId.manager;
                        expect(manager.traceTransactionStart).toBe(false);

                    })
            })

    });
