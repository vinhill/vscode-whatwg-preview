/**
 * Link hover preview
 */
import fetchPage from './network';
import { URL } from 'url';
import { debug, warn, err } from './logging';
import { Maybe } from './utils';

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

function getElementPreview(element: HTMLElement): Maybe<string> {
    // If there is a p and the next element is dl/ul/ol
    // then include both par and list.
    // If there is no p element
    // then get the closest heading and it's next x siblings.

    // TODO can we just render the HTML elements?

    let previewText = "";
    const par = element.closest('p');
    
    if (par) {
        previewText += markdownifyPar(par);
        const nextElem = par.nextElementSibling;
        if (nextElem && ['DL', 'UL', 'OL'].includes(nextElem.tagName)) {
            previewText += "\n\n" + markdownifyList(nextElem);
        }
    } else {
        const heading = element.closest('h1, h2, h3, h4, h5, h6');
        if (!heading) {
            warn("preview", `Unable to create preview for element, not part of a paragraph or heading.`);
            return;
        }
        previewText += heading.textContent?.trim() ?? "";
        let sibling = heading.nextElementSibling;
        let count = 0;
        while (sibling && count < 2) {
            if (sibling.tagName === 'P') {
                previewText += "\n\n" + markdownifyPar(sibling);
            } else if (['DL', 'UL', 'OL'].includes(sibling.tagName)) {
                previewText += "\n\n" + markdownifyList(sibling);
            }
            sibling = sibling.nextElementSibling;
            count++;
        }
    }
    
    return previewText.trim();
}

function markdownifyPar(element: Element): Maybe<string> {
    return element.textContent?.replace(/\n/g, ' ').trim();
}

function markdownifyList(element: Element, depth = 0): string {
    // TODO fix chatgpt errors
    // dl doesnt cover nesting
    // nesting duplicates textcontent. We have the text till sublist, then the text in sublist
    const indent = '  '.repeat(depth);
    if (element.tagName === 'DL') {
        return Array.from(element.children)
            .map(child => {
                if (child.tagName === 'DT') {
                    return `${indent}**${child.textContent?.trim()}**`;
                } else {
                    return `${indent}- ${child.textContent?.trim()}`;
                }
            })
            .join('\n');
    }
    if (element.tagName === 'UL' || element.tagName === 'OL') {
        return Array.from(element.children)
            .map((child, index) => {
                let prefix = element.tagName === 'OL' ? `${indent}${index + 1}.` : `${indent}-`;
                let text = `${prefix} ${child.textContent?.trim()}`;
                const nestedList = child.querySelector('DL, UL, OL');
                if (nestedList) {
                    text += "\n" + markdownifyList(nestedList, depth + 1);
                }
                return text;
            })
            .join('\n');
    }
    return "";
}

export async function getPreview(url: string): Promise<Maybe<string>> {
    debug("preview", `Getting hover content for ${url}`);

    const { origin, concept } = parseConceptLink(url) ?? {};
    if (!origin || !concept) return;

    const doc = await fetchPage(origin);
    if (!doc) return;

    const element = doc.getElementById(concept);
    if (!element) {
        warn("preview", `Concept ${concept} not found in ${origin}`);
        return;
    }

    return getElementPreview(element);
}
