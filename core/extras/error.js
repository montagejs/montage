    /**
        Defines extensions to intrinsic `Error`.
        @see {external:Error}
        @module montage/core/extras/error
    */

    exports.Error = Error;

    Error.getInfoForObject = function(object) {
        return Montage.getInfoForObject(object);
    };

    /**
     * Deserialize an Error object included in a serialization
     * @param {Deserializer} deserializer The Deserializer containing the serialization information
     * @function external:Error.deserializeSelf
    */
    Object.defineProperty(Error.prototype, "deserializeSelf", {
        value: function (deserializer) {
            var value;

            value = deserializer.getProperty("message");
            if (value) {
                this.message = value;
            }

            value = deserializer.getProperty("name");
            if (value) {
                this.name = value;
            }

            value = deserializer.getProperty("stack");
            if (value) {
                this.stack = value;
            }
        },
        writable: true,
        configurable: true
    });


    /**
     * Sserialize a Error object
     * @param {Deserializer} serializer The Serializer building out the serialization
     * @function external:Error.serializeSelf
    */
    Object.defineProperty(Error.prototype, "serializeSelf", {
        value: function (serializer) {

            serializer.setProperty("message", this.message);
            serializer.setProperty("name", this.name);

            if(this.stack) {
                serializer.setProperty("stack", this.stack);
            }

        },
        writable: true,
        configurable: true
    });
