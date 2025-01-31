/**
 * Simple logging module
 */
enum Severity { ERROR=1, WARNING=2, INFO=3, DEBUG=4 };

const logLevel = Severity.DEBUG;

function log(name: string, text: string, severity: Severity = Severity.INFO) {
    if (severity > logLevel) return;
    const msg = `[link-preview-${name}] - ${text}`;
    switch (severity) {
        case Severity.ERROR:
            console.error(msg);
        case Severity.WARNING:
            console.warn(msg);
        default:
            console.info(msg);
    }
}
export function err(name: string, text: string) {
    return log(name, text, Severity.ERROR);
}

export function warn(name: string, text: string) {
    return log(name, text, Severity.WARNING);
}

export function info(name: string, text: string) {
    return log(name, text, Severity.INFO);
}

export function debug(name: string, text: string) {
    return log(name, text, Severity.DEBUG);
}

export default { err, warn, info, debug };