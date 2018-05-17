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
            var entries, keys, values,
                i, n;

            entries = deserializer.getProperty("entries");
            if (entries) {
                for (i = 0, n = entries.length; i < n; i++) {
                    this.set(entries[i].key, entries[i].value);
                }
            } 
            if (!entries) {
                keys = deserializer.getProperty("keys");
                values = deserializer.getProperty("values");
                if (keys && values) {
                    for (i = 0, n = keys.length; i < n; i++) {
                        this.set(keys[i], values[i]);
                    }
                }
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