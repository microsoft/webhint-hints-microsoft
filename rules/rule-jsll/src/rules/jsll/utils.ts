import { IAsyncHTMLElement } from 'sonarwhal/dist/src/lib/types';
import { normalizeString } from 'sonarwhal/dist/src/lib/utils/misc';

const jsllDir = `https://az725175.vo.msecnd.net/scripts/jsll-`;

const severityMatch = (parentObj, prop, severity) => {
    return parentObj[severity].includes(prop);
};

const pluralizedVerb = (props) => {
    return props.length > 1 ? 'are' : 'is';
};

const reportMissingProps = (props, existingProps, strictLevel, target, eslintContext) => {
    if (!props || !props.length) {
        return;
    }
    const missingProps = props && props.filter((prop) => {
        return !existingProps.includes(prop);
    });

    if (missingProps && missingProps.length) {
        eslintContext.report(target, `${missingProps.join(', ')} ${pluralizedVerb(missingProps)} ${strictLevel} but missing.`);
    }
};

const isJsllDir = (element: IAsyncHTMLElement) => {
    const src = element.getAttribute('src');

    if (!src) {
        return false;
    }

    return normalizeString(src).startsWith(jsllDir);
};

export {
    isJsllDir,
    severityMatch,
    reportMissingProps
};
