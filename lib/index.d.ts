import { ICacheProvider, ICacheProviderOptions, CacheProvider } from 'sarah.js';
import * as redis from 'redis';
export interface IRedisProviderOptions extends ICacheProviderOptions {
    providerName: string;
    compareFn?(singleHash: string): any;
    settings?: redis.ClientOpts;
    client?: redis.RedisClient;
}
/**
 * Controll caches lifetime.
 */
export declare class RedisProvider extends CacheProvider implements ICacheProvider {
    private caches;
    name: string;
    client: redis.RedisClient;
    constructor(options?: IRedisProviderOptions);
    private compare(requestedHashes);
    /**
     * Used to set new values in Reddis based on SETNX Command,
     * if ttl is present set expiration as well.
     *
     * @param {{val: Object; hash: string}[]} requestedData
     * @param {number} ttl
     * @return {Promise<Object | Object[]>}
     */
    set(requestedData: {
        val: any;
        hash: string;
    }[], ttl?: number): Promise<any | any[]>;
    get(requestedHashes: string[]): Promise<any | any[]>;
    invalidateCache(requestedHash: any, ttl: number): Promise<{}>;
}
