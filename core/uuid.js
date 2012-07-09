/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
/* <notice>
 Code from node-uuid: https://github.com/broofa/node-uuid/raw/master/uuid.js<br/>
 MIT license https://github.com/broofa/node-uuid/blob/master/LICENSE.md<br/>
 </notice> */

/**
	@module montage/core/uuid
    @requires montage/core/core
*/
/**
    @class module:montage/core/uuid.Uuid
    @extends module:montage/core/core.Montage
 */
var CHARS = '0123456789ABCDEF'.split(''),
    FORMAT = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split(''),
    Uuid = exports.Uuid = Object.create(Object.prototype, /** @lends module:montage/core/uuid.Uuid# */ {
        /**
            Returns a univerally unique ID (UUID).
            @function
            @param {Property} argument
            @returns {String} The UUID.
        */
        generate: {
            enumerable: false,
            value: generate
        }
    });

exports.generate = generate;
function generate(argument) {
    var c = CHARS, id = FORMAT, r;

    id[0] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[1] = c[(r >>>= 4) & 0xf];
    id[2] = c[(r >>>= 4) & 0xf];
    id[3] = c[(r >>>= 4) & 0xf];
    id[4] = c[(r >>>= 4) & 0xf];
    id[5] = c[(r >>>= 4) & 0xf];
    id[6] = c[(r >>>= 4) & 0xf];
    id[7] = c[(r >>>= 4) & 0xf];

    id[9] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[10] = c[(r >>>= 4) & 0xf];
    id[11] = c[(r >>>= 4) & 0xf];
    id[12] = c[(r >>>= 4) & 0xf];
    id[15] = c[(r >>>= 4) & 0xf];
    id[16] = c[(r >>>= 4) & 0xf];
    id[17] = c[(r >>>= 4) & 0xf];

    id[19] = c[(r = Math.random() * 0x100000000) & 0x3 | 0x8];
    id[20] = c[(r >>>= 4) & 0xf];
    id[21] = c[(r >>>= 4) & 0xf];
    id[22] = c[(r >>>= 4) & 0xf];
    id[24] = c[(r >>>= 4) & 0xf];
    id[25] = c[(r >>>= 4) & 0xf];
    id[26] = c[(r >>>= 4) & 0xf];
    id[27] = c[(r >>>= 4) & 0xf];

    id[28] = c[(r = Math.random() * 0x100000000) & 0xf];
    id[29] = c[(r >>>= 4) & 0xf];
    id[30] = c[(r >>>= 4) & 0xf];
    id[31] = c[(r >>>= 4) & 0xf];
    id[32] = c[(r >>>= 4) & 0xf];
    id[33] = c[(r >>>= 4) & 0xf];
    id[34] = c[(r >>>= 4) & 0xf];
    id[35] = c[(r >>>= 4) & 0xf];

    return id.join('');
}
