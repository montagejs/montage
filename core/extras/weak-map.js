/**
    Defines extensions to intrinsic `WeakMap`.
    @see {external:WeakMap}
    @module montage/core/extras/weak-map
*/

/**
 * Deserialize a weak-map object included in a serialization
 * @param {Deserializer} deserializer The Deserializer containing the serialization information
 * @function external:WeakMap.deserializeSelf
*/
Object.defineProperty(WeakMap.prototype, "deserializeSelf", {
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
 * Serialize a WeakMap object
 * @param {Deserializer} serializer The Serializer building out the serialization
 * @function external:WeakMap.serializeSelf
*/
Object.defineProperty(WeakMap.prototype, "serializeSelf", {
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