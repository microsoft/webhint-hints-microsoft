/**
 * @fileoverview Validate the required config properties.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IRuleBuilder, IScriptParse, IScanEnd } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { isPotentialInitScript, validateNodeProps, configProps } from '../validator';
import { isObject } from '../utils';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */
const generateScript = (callInitCode) => {
    const script = `(function stubAwaInit() {
        var originalInit = window.awa && window.awa.init ? window.awa.init.bind(window.awa) : null;
        var configUsed;

        newInit = function () {
            configUsed = Array.prototype.slice.call(arguments);
        };

        if (window.awa) {
            window.awa.init = newInit;
        } else {
            // JSLL script was not included in the page.
            // Should still validate config.
            window.awa = { init: newInit };
        }

        function callInit() {
            ${callInitCode}
        };

        callInit();
        window.awa.init = originalInit;

        return configUsed;
    }())`;

    return script;
};

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {
        let script = '';
        let scriptResource;

        const populateScript = (scriptParse: IScriptParse) => {
            const sourceCode = scriptParse.sourceCode;

            if (!isPotentialInitScript(sourceCode)) {
                return;
            }

            const text = sourceCode.text;

            script = generateScript(text);
            scriptResource = scriptParse.resource;
        };

        const validateConfig = (configArgs): Array<Array<string>> => {
            const requiredMsgs = [];
            const optionalMsgs = [];

            if (!configArgs || !configArgs.length) {
                requiredMsgs.push(`No config argument was passed to JSLL initialization function "awa.init".`);

                return [requiredMsgs, optionalMsgs];
            }

            if (configArgs.length > 1) {
                requiredMsgs.push(`"init" arguments can't take more than one arguments.`);

                return [requiredMsgs, optionalMsgs];
            }

            const config = configArgs[0];

            if (!isObject(config)) {
                requiredMsgs.push(`The argument of "awa.init" is not of type Object.`);

                return [requiredMsgs, optionalMsgs];
            }


            validateNodeProps(configProps.config.required, config, 'required', requiredMsgs);
            validateNodeProps(configProps.config.optional, config, 'optional', optionalMsgs);

            return [requiredMsgs, optionalMsgs];
        };

        const evaluate = async (data: IScanEnd) => {
            if (!script.length) {
                // JSLL is not initialized at all, which is reported in the `jsll-awa-init` rule.
                return;
            }

            const { resource }: { resource: string } = data;

            const config = await context.evaluate(script);

            const [requiredMsgs, optionalMsgs] = validateConfig(config);

            requiredMsgs.forEach((message: string) => {
                context.report(scriptResource || resource, null, message);
            });

            optionalMsgs.forEach((message: string) => {
                context.report(scriptResource || resource, null, message, null, null, 1);
            });
        };

        return {
            'parse::javascript': populateScript,
            'scan::end': evaluate
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `Validate the required config properties.`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
