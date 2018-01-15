

import {ICacheProvider, ICacheProviderOptions, CacheProvider} from '@sarahjs/core';

import * as _ from 'lodash';
import * as redis from 'redis';

export interface IRedisProviderOptions extends ICacheProviderOptions {
    providerName: string;
    compareFn?(singleHash: string);
    settings?: redis.ClientOpts;
    client?: redis.RedisClient;
}
/**
 * Controll caches lifetime.
 */
export class RedisProvider extends CacheProvider implements ICacheProvider {
    private caches: any;
    name: string;
    client: redis.RedisClient;

    constructor(options?: IRedisProviderOptions) {
        super();
        if (options.client) {
            this.client = options.client;
        } else {
            if (!options.settings) options.settings = {};
            if (_.isEmpty(options.settings)) options.settings.url = 'redis://localhost:6379';

            this.client = redis.createClient(options.settings);
        }


        this.name = options.providerName;

        if (options) {
            if (options.compareFn) {
                console.warn('Redis provider compareFn options is not available.');
            }
        }
    }

    private compare(requestedHashes: string[]) {
        return  new Promise((resolve, reject) => {
            const foundCache = [];


            this.client.mget(requestedHashes, (err, replies: any[]) => {
                if (err) resolve([]);

                replies.forEach((singleReply) => {
                    if (singleReply) foundCache.push(JSON.parse(singleReply));
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
     * @param {number} ttl - In Milliseconds
     * @return {Promise<Object | Object[]>}
     */
    public set(requestedData: {val: any, hash: string}[], ttl?: number): Promise<any | any[]> {
        return new Promise((resolve, reject) => {
            // due to redis working with seconds
            const batchJobs = [];

            for (let i = 0; i < requestedData.length; i ++) {
                const singleRequestData = requestedData[i];



                if (ttl) {
                    batchJobs.push(['PSETEX', singleRequestData.hash, ttl, JSON.stringify(singleRequestData.val)]);
                } else {
                    batchJobs.push(['SET', singleRequestData.hash, JSON.stringify(singleRequestData.val)]);
                }

            }

            this.client.batch(batchJobs)
            .exec((err, replies) => {
                resolve(requestedData.map((single) => single.val));
            });
        });
    }


    public async get(requestedHashes: string[]): Promise<any | any[]> {
        return this.compare(requestedHashes);
    }

    public invalidateCache(requestedHash: any, ttl: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.expire(requestedHash, ttl, (err) => {
                resolve();
            });
        });
    }

}

