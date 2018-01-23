import { IAsyncHTMLElement } from 'sonarwhal/dist/src/lib/types';
import { normalizeString } from 'sonarwhal/dist/src/lib/utils/misc';

const jsllDir = `az725175.vo.msecnd.net/scripts/jsll-`;

const severityMatch = (parentObj: object, prop: string, severity: string) => {
    return parentObj[severity].includes(prop);
};

const pluralizedVerb = (props: Array<string>) => {
    return props.length > 1 ? 'are' : 'is';
};

const reportMissingProps = (props: Array<string>, existingProps: Array<string>, severity: string, target, eslintContext) => {
    if (!props || !props.length) {
        return;
    }
    const missingProps = props && props.filter((prop) => {
        return !existingProps.includes(prop);
    });

    if (missingProps && missingProps.length) {
        eslintContext.report(target, `${missingProps.join(', ')} ${pluralizedVerb(missingProps)} ${severity} but missing.`);
    }
};

const isJsllDir = (element: IAsyncHTMLElement) => {
    const src = element.getAttribute('src');

    if (!src) {
        return false;
    }

    return normalizeString(src).includes(jsllDir);
};

const isHeadElement = (element: IAsyncHTMLElement): boolean => {
    return normalizeString(element.nodeName) === 'head';
};

export {
    isHeadElement,
    isJsllDir,
    severityMatch,
    reportMissingProps
};
