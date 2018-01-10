import * as _ from 'lodash';

export const modifyValue = (obj, targetProp, targetValue) => {
    if (!(obj instanceof Object) || Array.isArray(obj)) {
        return;
    }

    const isDelete = targetValue === null;

    if (obj.hasOwnProperty(targetProp)) {
        if (isDelete) {
            delete obj[targetProp];
        } else {
            obj[targetProp] = targetValue;
        }
    } else {
        const props = Object.keys(obj);

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

export const code = {
    emptyObjconfig: `awa.init({});`,
    initConfig: `awa.init(config);`,
    jsllScript: `<script src="https://az725175.vo.msecnd.net/scripts/jsll-4.js" type="text/javascript"></script>`,
    noConfigArgs: `awa.init();`,
    notImmediateInitNoFn: `var a = 1;</script><script>awa.init({})`,
    notImmediateInithasFn: `console.log('a');</script><script>awa.init({})`
};

export const deleteProp = (prop) => {
    const missiongPropConfig = _.cloneDeep(perfectConfig);
    const props = Array.isArray(prop) ? prop : [prop];

    props.forEach((property) => {
        modifyValue(missiongPropConfig, property, null);
    });

    return `var config=${JSON.stringify(missiongPropConfig)};`;
};

export const modifyConfigVal = (targetProp, targetValue) => {
    const modifiedConfig = _.cloneDeep(perfectConfig);

    modifyValue(modifiedConfig, targetProp, targetValue);

    return `var config=${JSON.stringify(modifiedConfig)};`;
};

export const scriptWrapper = (config, initCode, includeJSLLScript = true) => {
    return `${includeJSLLScript ? code.jsllScript : ''}<script>${config || ''}${initCode || ''}</script>`;
};
