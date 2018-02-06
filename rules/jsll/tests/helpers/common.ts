import { cloneDeep } from 'lodash';

/** Look for the target property recursively and modify/delete the value */
export const modifyValue = (obj, targetProp: string, targetValue) => {
    if (!(obj instanceof Object) || Array.isArray(obj)) {
        return;
    }

    const isDelete: boolean = (typeof targetValue === 'undefined') || (targetValue === null);

    if (obj.hasOwnProperty(targetProp)) {
        if (isDelete) {
            delete obj[targetProp];
        } else {
            obj[targetProp] = targetValue;
        }
    } else {
        const props: Array<string> = Object.keys(obj);

        props.forEach((childProp) => {
            modifyValue(obj[childProp], targetProp, targetValue);
        });
    }
};

export const perfectConfig = {
    autoCapture: {
        lineage: true,
        scroll: true
    },
    coreData: {
        appId: 'YourAppId',
        env: 'env',
        market: 'en-us',
        pageName: 'name',
        pageType: 'type'
    },
    useShortNameForContentBlob: true
};

/* eslint-disable no-useless-escape */
const calculatedConfig = `
var appId = 'app' + 'id';
var environment = 'test';
var isprod = 'True';
if (isprod.toLowerCase() === 'true') {
    environment = 'prod';
}
var pageName = appId.replace('id', '');
var pageType = pageName === 'config' ? 'json' : 'html';
var pathName = '/en-us';
var market = pathName.toString().replace(/^\\/([a-z]*\-[a-z]*)/i, '$1');

var config = {
    autoCapture: {},
    coreData: {
        appId: appId,
        env: environment,
        pageName: pageName,
        pageType: pageType,
        market: market
    }
};

config.autoCapture.scroll = false;
config.autoCapture.lineage = false;
`;
/* eslint-enable no-useless-escape */

export const code = {
    calculatedConfig,
    emptyObjconfig: `awa.init({});`,
    initConfig: `awa.init(config);`,
    jsllScript: `<script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>`,
    noConfigArgs: `awa.init();`,
    notImmediateInitNoFn: `var a = 1;</script><script>awa.init({})`,
    notImmediateInithasFn: `console.log('a');</script><script>awa.init({})`,
    perfectConfig
};

/** Delete one or more properties. */
export const deleteProp = (prop: string | Array<string>): string => {
    const missiongPropConfig = cloneDeep(perfectConfig);
    const props: Array<string> = Array.isArray(prop) ? prop : [prop];

    props.forEach((property) => {
        modifyValue(missiongPropConfig, property, null);
    });

    return `var config=${JSON.stringify(missiongPropConfig)};`;
};

/** Modify the value of a (nested property). */
export const modifyConfigVal = (targetProp: string, targetValue: any): string => {
    const modifiedConfig = cloneDeep(perfectConfig);

    modifyValue(modifiedConfig, targetProp, targetValue);

    return `var config=${JSON.stringify(modifiedConfig)};`;
};

export const scriptWrapper = (config: string, initCode: string, includeJSLLScript: boolean = true): string => {
    let res = `${includeJSLLScript ? code.jsllScript : ''}`;

    if (config || initCode) {
        res += `<script>${config || ''}${initCode || ''}</script>`;
    }

    return res;
};
