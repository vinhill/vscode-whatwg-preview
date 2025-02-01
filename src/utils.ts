import { URL } from "url";
import { err } from "./logging";

export type Maybe<T> = NonNullable<T> | undefined;

export function parseConceptLink(url: string): Maybe<{ origin: string, concept: string }> {
    try {
        const parsedUrl = new URL(url);
        const origin = parsedUrl.origin;
        const hash = parsedUrl.hash?.replace('#', '');
        if (!hash || hash.length == 0) return;
        return { origin, concept: hash };
    } catch (error) {
        err("preview", `Error parsing ${url}: ${error}`);
    }
}
