/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

var Parser = exports.Parser = Montage.create(Montage, {

    newWithLanguage: {
        value: function (language, callback) {
            var self = Montage.create(this);
            self.tokens = [];
            self.state = language.parsePrevious(function (syntax) {
                callback && callback(syntax);
                return language.parseEof();
            });
            return self;
        }
    },

    state: {
        value: null,
        writable: true
    },

    emit: {
        value: function (token) {
            try {
                this.tokens.push(token);
                this.state = this.state(token);
                return this;
            } catch (exception) {
                if (exception instanceof SyntaxError) {
                    throw new SyntaxError(exception.message + ' at ' + this.representation());
                } else {
                    throw exception;
                }
            }
        }
    },

    state: {
        value: null,
        writable: true
    },

    syntax: {
        value: null,
        writable: true,
        serializable: true
    },

    representation: {
        value: function () {
            return this.tokens.reduce(function (hither, token) {
                if (token.type === 'literal') {
                    return hither + '(' + JSON.stringify(token.value) + ')';
                } else {
                    return hither + '.' + token.type;
                }
            }, 'Selector');
        }
    }

});
