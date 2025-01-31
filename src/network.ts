/**
 * Module to fetch and cache html pages
 */
import * as https from 'https';
import { JSDOM } from 'jsdom';
import { debug, err } from './logging';

// cached pages
let cache: { [url: string]: Document } = {};

// pending page fetches
let pending: { [url: string]: Promise<Document | null> } = {};

export default async function fetchPage(url: string): Promise<Document | null> {
    if (url in cache) return cache[url];
    if (url in pending) return pending[url];
    
    debug("network", `Fetching ${url}`);
    const promise = new Promise<Document | null>((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const dom = new JSDOM(data);
                    cache[url] = dom.window.document;
                    debug("network", `Cached ${url}`);
                    resolve(dom.window.document);
                } catch (error) {
                    err("network", `Error parsing fetched ${url}: ${error}`);
                    reject(error);
                }
            });
        }).on('error', error => {
            err("network", `Error fetching ${url}: ${error}`);
            reject(error);
        });
    });
    
    pending[url] = promise;
    return promise;
}