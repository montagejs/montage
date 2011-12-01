/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var Selector = require("montage/data/selector").Selector;
var Q = require("montage/core/promise");
var logger = require("montage/core/logger").logger("property-spec");

var Company = exports.Company = Montage.create(Montage, {

    name: {
        enumerable: true,
        serializable: true,
        value: null
    },

    employees: {
        enumerable: true,
        serializable: true,
        value: null
    }


});

describe("data/selector/string-selector-spec", function() {
    describe("Evaluate each in array ", function() {
        var company = Company.create();
        company.name = "Motorola Mobility";
        company.employees = [
                                "Aaron Hank",
                                "Abagnale Frank",
                                "Abbey Edward",
                                "Abel Reuben",
                                "Abelson Hal",
                                "Abourezk James",
                                "AB parker james",
                                "Abrams Creighton",
                                "Ace Jane",
                                "Acton John",
                                "Adams Abigail",
                                "Adams Douglas",
                                "Adams Henry",
                                "Adams John",
                                "Adams John Quincy",
                                "Adams Samuel",
                                "Adams Scott",
                                "adam Mickey",
                                "adam M sago",
                                "Addams Jane",
                                "Addison Joseph",
                                "Adorno Theodor",
                                "Adler Alfred",
                                "Aeschylus",
                                "Aesop",
                                "Affleck Ben",
                                "Agena Keiko",
                                "Agnew Spiro",
                                "Ahbez Eden",
                                "Ahern Bertie",
                                "Ah Koy James",
                                "Ah Koy James R",
                                "Ahmad",
                                "Ah Aliken Sparrow",
                                "Aiken Clay",
                                "Aiken Conrad",
                                "aiken cold",
                            ];
        it("containing string", function() {

            var promise = company.employees.filterWithSelector(Selector.contains("Adam"));

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);

            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

        it("case insensitive containing string", function() {

            var promise = company.employees.filterWithSelector(Selector.caseInsensitiveContains("Adam"));

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);

            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

        it("ends with string", function() {

            var promise = company.employees.filterWithSelector(Selector.endsWith("James"));

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);

            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

        it("case insensitive ends with string", function() {

            var promise = company.employees.filterWithSelector(Selector.caseInsensitiveEndsWith("James"));

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);

            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

        it("starts with string", function() {

            var promise = company.employees.filterWithSelector(Selector.startsWith("Aiken"));

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);

            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

        it("case insensitive starts with string", function() {

            var promise = company.employees.filterWithSelector(Selector.caseInsensitiveStartsWith("Aiken"));

            waitsFor(function() {
                return !Q.isPromise(promise.valueOf());
            }, "promise", 500);

            runs(function() {
                var result = promise.valueOf();
                expect(result).not.toBeNull();
            });
        });

    });
});
