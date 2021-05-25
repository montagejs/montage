    /**
        Defines extensions to intrinsic `Map`.
        @see {external:Map}
        @module montage/core/extras/map
    */

    /**
     * Deserialize a map object included in a serialization
     * @param {Deserializer} deserializer The Deserializer containing the serialization information
     * @function external:Map.deserializeSelf
    */
    Object.defineProperty(Map.prototype, "deserializeSelf", {
        value: function (deserializer) {
            var entries, keys, values;

            entries = deserializer.getProperty("entries");
            if (entries) {
                this._entries = entries;
            } else {
                keys = deserializer.getProperty("keys");
                values = deserializer.getProperty("values");
                if (keys && values) {
                    this._keys = keys;
                    this._values = values;
                }
            }
        },
        writable: true,
        configurable: true
    });
    Object.defineProperty(Map.prototype, "deserializedFromSerialization", {

        value: function (label) {

            if(this._entries) {
                var entries = this._entries, i, n;
                for (i = 0, n = entries.length; i < n; i++) {
                    this.set(entries[i].key, entries[i].value);
                }

                if(this._entries.length !== this.size) {
                    console.warn("deserialized entries likely overlapped keys resulting in lost content");
                }
                delete this._entries;

            } else if(this._keys && this._values) {
                var keys = this._keys,
                    values = this._values,
                    i, n;
                for (i = 0, n = keys.length; i < n; i++) {
                    this.set(keys[i], values[i]);
                }

                delete this._keys;
                delete this._values;
            }
        },
        writable: true,
        configurable: true
    });



    /**
     * Sserialize a Map object
     * @param {Deserializer} serializer The Serializer building out the serialization
     * @function external:Map.serializeSelf
    */
    Object.defineProperty(Map.prototype, "serializeSelf", {
        value: function (serializer) {
            var entries = this.entries(),
                serializedKeys = [],
                serializedValues = [],
                entry;

            while ((entry = entries.next().value)) {
                serializedKeys.push(entry[0]);
                serializedValues.push(entry[1]);
            }

            serializer.setProperty("keys", serializedKeys);
            serializer.setProperty("values", serializedValues);

        },
        writable: true,
        configurable: true
    });

