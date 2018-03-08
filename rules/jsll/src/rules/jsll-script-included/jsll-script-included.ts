/**
 * @fileoverview This rule confirms that JSLL script is included in the page
 */
import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IAsyncHTMLElement, IRule, ElementFound, Severity, RuleMetadata } from 'sonarwhal/dist/src/lib/types';
import { normalizeString } from 'sonarwhal/dist/src/lib/utils/misc';

import { isJsllDir } from '../utils';
import { RuleScope } from 'sonarwhal/dist/src/lib/enums/rulescope';

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class JsllScriptIncludedRule implements IRule {
    public static readonly meta: RuleMetadata = {
        docs: {
            category: Category.other,
            description: `This rule confirms that JSLL script is included in the head of the page`
        },
        id: 'jsll/jsll-script-included',
        schema: [],
        scope: RuleScope.any
    }

    public constructor(context: RuleContext) {
        // Messages.
        const noScriptInHeadMsg: string = `No JSLL script was included in the <head> tag.`;
        const redundantScriptInHeadMsg: string = `More than one JSLL scripts were included in the <head> tag.`;
        const warningScriptVersionMsg: string = `Use the latest release of JSLL with 'jsll-4.js'. It is not recommended to specify the version number unless you wish to lock to a specific release.`;
        const invalidScriptVersionMsg: string = `The jsll script versioning is not valid.`;
        const wrongScriptOrderMsg: string = `The JSLL script isn't placed prior to other scripts.`;

        const jsllDir: string = `https://az725175.vo.msecnd.net/scripts/jsll-`;
        /** Flag that indicates if script is in head. */
        let isHead: boolean = true;
        /**  Total number of script tags in head. */
        let totalHeadScriptCount: number = 0;
        /** Total number of JSLL script tags in head. */
        let jsllScriptCount: number = 0;

        /** Handler on parsing of a script: Validate the JSLL api link. */
        const validateScript = async (data: ElementFound) => {
            const { element, resource }: { element: IAsyncHTMLElement, resource: string } = data;
            const passRegex = new RegExp(`^(\\d+\\.)js`); // 4.js
            const warningRegex = new RegExp(`^(\\d+\\.){2,}js`); // 4.2.1.js

            if (!isHead) {
                return;
            }

            totalHeadScriptCount += 1;

            if (!isJsllDir(element)) {
                return;
            }

            jsllScriptCount += 1;

            if (jsllScriptCount > 1) {
                await context.report(resource, element, redundantScriptInHeadMsg);

                return;
            }

            if (totalHeadScriptCount > 1 && (jsllScriptCount === 1)) {
                // There are other scripts in <head> prior to this JSLL script.
                await context.report(resource, element, wrongScriptOrderMsg);

                return;
            }

            const fileName: string = normalizeString(element.getAttribute('src').replace(jsllDir, ''));

            if (passRegex.test(fileName)) {
                return;
            }

            if (warningRegex.test(fileName)) {
                await context.report(resource, element, warningScriptVersionMsg, null, null, Severity.warning);

                return;
            }

            await context.report(resource, element, invalidScriptVersionMsg);

            return;
        };

        /** Handler on entering the body element. */
        const enterBody = async (event: ElementFound) => {
            const { resource }: { resource: string } = event;

            isHead = false;

            if (jsllScriptCount === 0) {
                await context.report(resource, null, noScriptInHeadMsg);

                return;
            }
        };

        context.on('element::body', enterBody);
        context.on('element::script', validateScript);
    }
}
