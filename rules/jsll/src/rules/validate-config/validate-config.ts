/**
 * @fileoverview Validate the required config properties.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, ScanEnd, RuleMetadata } from 'sonarwhal/dist/src/lib/types';
// import { ScriptParse } from 'sonarwhal/dist/src/lib/parsers/javascript/types';
import { ScriptParse } from '@sonarwhal/parser-javascript/dist/src/scriptParse';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { isPotentialInitScript, validateNodeProps, configProps } from '../validator';
import { isObject } from '../utils';
import { RuleScope } from 'sonarwhal/dist/src/lib/enums/rulescope';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */
/** Generate the script to be evaluated given the init code. */
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


export default class JsllValidateConfigRule implements IRule {
    public static readonly meta: RuleMetadata = {
        docs: {
            category: Category.other,
            description: `Validate the required config properties.`
        },
        id: 'jsll/validate-config',
        schema: [],
        scope: RuleScope.any
    }

    public constructor(context: RuleContext) {
        /** Cache for the init code. */
        let script = '';
        /** Cache for the init code resource. */
        let scriptResource;

        /** Handler on parse javascript: cache the init code and resource. */
        const populateScript = (scriptParse: ScriptParse) => {
            const sourceCode = scriptParse.sourceCode;

            if (!isPotentialInitScript(sourceCode)) {
                return;
            }

            const text = sourceCode.text;

            script = generateScript(text);
            scriptResource = scriptParse.resource;
        };

        /** Validate required and optional config property values. */
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

        /** Handler on scan end: validate `config`. */
        const evaluate = async (data: ScanEnd) => {
            if (!script.length) {
                // JSLL is not initialized at all, which is reported in the `awa-init` rule.
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

        context.on('parse::javascript', populateScript);
        context.on('scan::end', evaluate);
    }
}
