/**
 * Dropdown cache to avoid repeated database queries
 */

class DropdownCache {
    constructor(ttl = 3600000) { // 1 hour default TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    /**
     * Generate cache key from dropdown configuration
     * Key is based on database name, query, label field, and value field to ensure uniqueness for different dropdown configurations. This allows the cache to store and retrieve dropdown options accurately based on their specific configuration, preventing collisions and ensuring that the correct options are returned for each dropdown column in the Excel export.
     */
    generateKey(databaseName, query, labelField, valueField) {
        return `${databaseName}:${query}:${labelField}:${valueField}`;
    }

    /**
     * Get cached dropdown data
     * When retrieving cached dropdown data, the method checks if the cache entry exists and whether it has expired based on the defined TTL. If the cache entry is valid, it returns the cached data; otherwise, it removes the expired entry from the cache and returns null, indicating that a new database query is needed to fetch fresh dropdown options. This mechanism ensures that the cache remains up-to-date and prevents stale data from being used in the Excel export process.
     */
    get(databaseName, query, labelField, valueField) {
        const key = this.generateKey(databaseName, query, labelField, valueField);
        const cachedItem = this.cache.get(key);

        if (!cachedItem) {
            return null;
        }

        // Check if cache has expired
        if (Date.now() - cachedItem.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cachedItem.data;
    }

    /**
     * Set dropdown data in cache
     */
    set(databaseName, query, labelField, valueField, data) {
        const key = this.generateKey(databaseName, query, labelField, valueField);
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear specific cache entry
     */
    clear(databaseName, query, labelField, valueField) {
        const key = this.generateKey(databaseName, query, labelField, valueField);
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clearAll() {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }

    /**
     * Get cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            items: Array.from(this.cache.entries()).map(([key, value]) => ({
                key,
                cached: new Date(value.timestamp),
                expired: Date.now() - value.timestamp > this.ttl
            }))
        };
    }
}

/**
 * Global dropdown cache instance
 */
let globalDropdownCache = new DropdownCache();

module.exports = {
    DropdownCache,
    getGlobalDropdownCache: () => globalDropdownCache,
    setGlobalDropdownCache: (cache) => { globalDropdownCache = cache; },
    createDropdownCache: (ttl) => new DropdownCache(ttl)
};
