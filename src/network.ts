/**
 * Module to fetch and cache html pages
 */
import * as https from 'https';
import { JSDOM } from 'jsdom';
import { debug, err } from './logging';
import { Maybe } from './utils';

// cached pages
let cache: { [url: string]: string } = {};

// pending page fetches
let pending: { [url: string]: Promise<Maybe<string>> } = {};

export async function fetchHTML(url: string): Promise<Maybe<string>> {
    if (url in cache) return cache[url];
    if (url in pending) return pending[url];

    debug("network", `Fetching ${url}`);
    const promise = new Promise<Maybe<string>>((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    cache[url] = data;
                    debug("network", `Cached ${url}`);
                    resolve(data);
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

export async function fetchDocument(url: string): Promise<Maybe<Document>> {
    const html = await fetchHTML(url);
    if (!html) return;
    return new JSDOM(html).window.document;
}
