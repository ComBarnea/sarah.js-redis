"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@sarahjs/core");
const _ = require("lodash");
const redis = require("redis");
/**
 * Controll caches lifetime.
 */
class RedisProvider extends core_1.CacheProvider {
    constructor(options) {
        super();
        if (options.client) {
            this.client = options.client;
        }
        else {
            if (!options.settings)
                options.settings = {};
            if (_.isEmpty(options.settings))
                options.settings.url = 'redis://localhost:6379';
            this.client = redis.createClient(options.settings);
        }
        this.name = options.providerName;
        if (options) {
            if (options.compareFn) {
                console.warn('Redis provider compareFn options is not available.');
            }
        }
    }
    compare(requestedHashes) {
        return new Promise((resolve, reject) => {
            const foundCache = [];
            this.client.mget(requestedHashes, (err, replies) => {
                if (err)
                    resolve([]);
                replies.forEach((singleReply) => {
                    foundCache.push(JSON.parse(singleReply));
                });
                resolve(foundCache);
            });
        });
    }
    /**
     * Used to set new values in Reddis based on SETNX Command,
     * if ttl is present set expiration as well.
     *
     * @param {{val: Object; hash: string}[]} requestedData
     * @param {number} ttl
     * @return {Promise<Object | Object[]>}
     */
    set(requestedData, ttl) {
        return new Promise((resolve, reject) => {
            const batchJobs = [];
            for (let i = 0; i < requestedData.length; i++) {
                const singleRequestData = requestedData[i];
                if (ttl) {
                    batchJobs.push('SETEX', singleRequestData.hash, ttl, JSON.stringify(singleRequestData.val));
                }
                else {
                    batchJobs.push('SET', singleRequestData.hash, JSON.stringify(singleRequestData.val));
                }
            }
            this.client.batch(batchJobs)
                .exec((err, replies) => {
                resolve(requestedData.map((single) => single.val));
            });
        });
    }
    async get(requestedHashes) {
        return this.compare(requestedHashes);
    }
    invalidateCache(requestedHash, ttl) {
        return new Promise((resolve, reject) => {
            this.client.expire(requestedHash, ttl, (err) => {
                resolve();
            });
        });
    }
}
exports.RedisProvider = RedisProvider;
//# sourceMappingURL=index.js.map