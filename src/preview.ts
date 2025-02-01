/**
 * Link hover preview
 */
import { fetchDocument } from './network';
import { debug, warn } from './logging';
import { Maybe, parseConceptLink } from './utils';

function getElementPreview(element: HTMLElement): Maybe<string> {
    let preview = "";

    const par = element.closest('p');
    if (par) {
        preview += par.outerHTML;

        const nextElem = par.nextElementSibling;
        if (nextElem && ['DL', 'UL', 'OL'].includes(nextElem.tagName)) {
            preview += nextElem.outerHTML;
        }

        return preview;
    } else {
        const heading = element.closest('h1, h2, h3, h4, h5, h6');
        if (!heading) {
            warn("preview", `Unable to create preview for element, not part of a paragraph or heading.`);
            return;
        }
        preview += heading.outerHTML;
        let sibling = heading.nextElementSibling;
        let count = 0;
        while (sibling && count < 2) {
            if (['P', 'DL', 'UL', 'OL'].includes(sibling.tagName)) {
                preview += sibling.outerHTML;
            }
            sibling = sibling.nextElementSibling;
            count++;
        }
    }
}

export default async function getPreview(url: string): Promise<Maybe<string>> {
    debug("preview", `Getting hover content for ${url}`);

    const { origin, concept } = parseConceptLink(url) ?? {};
    if (!origin || !concept) return;

    const doc = await fetchDocument(origin);
    if (!doc) return;

    const element = doc.getElementById(concept);
    if (!element) {
        warn("preview", `Concept ${concept} not found in ${origin}`);
        return "Stale link.";
    }

    return getElementPreview(element);
}
