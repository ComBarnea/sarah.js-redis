

import {ICacheProvider, ICacheProviderOptions, CacheProvider} from 'sarah.js';

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
                this.compare = options.compareFn;
            }
        }
    }

    private compare(singleHash: string) {
        let value = null;
        Object.keys(this.caches).forEach((singleStoredHash)  => {
            if (singleStoredHash === singleHash) value = this.caches[singleStoredHash];
        });

        return value;
    }

    public async set(requestedData: {val: any, hash: string}[], ttl?: number): Promise<any | any[]> {
        for (let i = 0; i < requestedData.length; i ++) {
            const singleRequestData = requestedData[i];

            if (!this.compare(singleRequestData.hash)) {
                this.caches[singleRequestData.hash] = singleRequestData.val;
            }

            if (ttl) {
                this.invalidateCache(singleRequestData.hash, ttl)
                    .then(() => {
                        // console.log();
                    })
                    .catch((err) => {
                        // console.log();
                    });
            }

        }


        return requestedData.map((single) => single.val);
    }


    public async get(requestedHashes: string[]): Promise<any | any[]> {
        // console.log('get', requestedHashes);
        const foundCache = [];

        requestedHashes.forEach((singleRequest) => {
            const isFound = this.compare(singleRequest);

            if (isFound) foundCache.push(this.caches[singleRequest]);
        });


        return foundCache;
    }

    public async invalidateCache(requestedHash: any, ttl: number) {
        setTimeout(() => {
            this.removeFromCache(requestedHash);
        }, ttl);
    }

    private removeFromCache(requestedHash: string) {
        // console.log('removing', requestedHash);
        this.caches[requestedHash] = null;
    }
}

