/**
 * @fileoverview This rule confirms that JSLL script is included in the page
 */
import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IAsyncHTMLElement, IRule, IRuleBuilder, IElementFound, ITraverseUp, ITraverseDown, Severity } from 'sonarwhal/dist/src/lib/types';
import { normalizeString } from 'sonarwhal/dist/src/lib/utils/misc';

import { isJsllDir, isHeadElement } from '../utils';

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {
        // Messages.
        const noScriptInHeadMsg: string = `No JSLL script was included in the <head> tag.`;
        const redundantScriptInHeadMsg: string = `More than one JSLL scripts were included in the <head> tag.`;
        const warningScriptVersionMsg: string = `Use the latest release of JSLL with 'jsll-4.js'. It is not recommended to specify the version number unless you wish to lock to a specific release.`;
        const invalidScriptVersionMsg: string = `The jsll script versioning is not valid.`;
        const wrongScriptOrderMsg: string = `The JSLL script isn't placed prior to other scripts.`;

        const jsllDir: string = `https://az725175.vo.msecnd.net/scripts/jsll-`;
        let isHead: boolean = false; // Flag to indicate if script is in head.
        let totalHeadScriptCount: number = 0; // Total number of script tags in head.
        let jsllScriptCount: number = 0; // Total number of JSLL script tag in head.

        const validateScript = async (data: IElementFound) => {
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

            if (totalHeadScriptCount > 1) {
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

        const traverseDown = (event: ITraverseDown) => {
            if (!isHeadElement(event.element)) {
                return;
            }

            isHead = true;
        };

        const traverseUp = async (event: ITraverseUp) => {
            const { resource }: { resource: string } = event;

            if (!isHeadElement(event.element)) {
                return;
            }

            if (jsllScriptCount === 0) {
                await context.report(resource, null, noScriptInHeadMsg);

                return;
            }

            isHead = false;
        };

        return {
            'element::script': validateScript,
            'traverse::down': traverseDown,
            'traverse::up': traverseUp
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `This rule confirms that JSLL script is included in the head of the page`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: false
    }
};

module.exports = rule;
