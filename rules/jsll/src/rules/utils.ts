import { IAsyncHTMLElement } from 'sonarwhal/dist/src/lib/types';
import { normalizeString } from 'sonarwhal/dist/src/lib/utils/misc';

const jsllDir = `az725175.vo.msecnd.net/scripts/jsll-`;

const severityMatch = (parentObj: object, prop: string, severity: string) => {
    return parentObj[severity].includes(prop);
};

const pluralizedVerb = (props: Array<string>) => {
    return props.length > 1 ? 'are' : 'is';
};

const getMissingProps = (props: Array<string>, existingProps: Array<string>): Array<string> => {
    if (!props || !props.length) {
        return [];
    }
    const missingProps = props && props.filter((prop) => {
        return !existingProps.includes(prop);
    });

    return missingProps;
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

const isObject = (target) => {
    return (typeof target === 'object') && (!Array.isArray(target));
};

/** Tell if a expression statement is `awa.init` or `window.awa.init` */
const isInitCode = (expression) => {
    const { callee } = expression;

    if (callee && callee.object) {
        const callInitProp = callee.property && callee.property.name === 'init';

        if ((callee.object.name === 'awa') && callInitProp) {
            // awa.init(...)
            return true;
        }

        const subObject = callee.object.object;

        if (callee.object.object) {
            // window.awa.init(...)
            const callAwa = subObject.name === 'window' && callee.object.property.name === 'awa';

            return callAwa && callInitProp;
        }
    }

    return false;
};

export {
    isHeadElement,
    isInitCode,
    isObject,
    isJsllDir,
    pluralizedVerb,
    severityMatch,
    getMissingProps
};
