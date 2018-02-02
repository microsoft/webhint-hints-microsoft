/**
 * @fileoverview Validate the use of `awa.init` to initialize the JSLL script.
 */

import { Category } from 'sonarwhal/dist/src/lib/enums/category';
import { RuleContext } from 'sonarwhal/dist/src/lib/rule-context';
import { IRule, IAsyncHTMLElement, IRuleBuilder, IElementFound, IScriptParse } from 'sonarwhal/dist/src/lib/types';
import { debug as d } from 'sonarwhal/dist/src/lib/utils/debug';

import { isPotentialInitScript, configIsDefined } from '../validator';
import { isJsllDir, isInitCode } from '../utils';

import { Linter } from 'eslint';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {
        const linter = new Linter();

        /** States available. */
        enum State {
            apiBody,
            apiHead,
            body,
            bodyOtherScript,
            head,
            headOtherScript,
            start
        }
        /** Current state. */
        let currentState: State = State.start;
        /** Error messages. */
        const messages = {
            noInit: `JSLL is not initialized with "awa.init(config)" function in <head>. Initialization script should be placed immediately after JSLL script.`,
            notCallASAP: `"awa.init" is not called as soon as possible.`,
            notImmediateAfter: `The JSLL init script should be immediately following the JSLL script.`,
            notInHead: `The JSLL init script should be in <head>.`,
            undefinedConfig: `The variable passed to "awa.init" is not defined.`
        };

        /** A collection of possible states when travering in head. */
        const inHead: Array<State> = [State.head, State.apiHead, State.headOtherScript];
        /** A collection of possible states when traversing in body. */
        const inBody: Array<State> = [State.body, State.apiBody, State.bodyOtherScript];
        /** A collection of possible states after visiting non-init scripts. */
        const otherScripts: Array<State> = [State.headOtherScript, State.bodyOtherScript];
        /**  If the linter has run. */
        let validated: boolean = false;
        /** Cache for external init script content. */
        let tempInit: IScriptParse;

        linter.defineRule('jsll-awa-init', {
            create(eslintContext) {
                let isFirstExpressionStatement: boolean = true;

                return {
                    ExpressionStatement(node) {
                        const expression = node.expression;
                        const isInit = isInitCode(expression);

                        if (isInit) {
                            if (!isFirstExpressionStatement) {
                                eslintContext.report(node, messages.notCallASAP);
                            }

                            if (!configIsDefined(node, eslintContext)) {
                                eslintContext.report(node, messages.undefinedConfig);
                            }
                        }

                        isFirstExpressionStatement = false;
                        validated = true;
                    }
                };
            }
        });

        /** Handler on parsing of a script: Validate the init script. */
        const validateScript = async (scriptParse: IScriptParse) => {
            const sourceCode = scriptParse.sourceCode;

            if (!isPotentialInitScript(sourceCode)) {
                if (currentState !== State.start) {
                    // Only change state in `validateScript` after traversal starts.
                    // Otherwise state such as `bodyOtherScript` will appear before `head`.
                    currentState = inHead.includes(currentState) ? State.headOtherScript : State.bodyOtherScript;
                }

                return;
            }

            if (currentState === State.start) {
                // When jsll init script is included in an external script
                // `parse::javascript` of the init script is emitted before `element::script` of the JSLL link.
                // So wait to run `validateScript` until traversal starts.
                tempInit = scriptParse;

                return;
            }

            if (otherScripts.includes(currentState)) {
                // Not immediate after the JSLL link.
                await context.report(scriptParse.resource, null, messages.notImmediateAfter);
            }

            if (!inHead.includes(currentState)) {
                await context.report(scriptParse.resource, null, messages.notInHead);
            }

            const results = linter.verify(sourceCode, { rules: { 'jsll-awa-init': 'error' } });

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        /** Handler on entering a script element: Update state if it's the JSLL api link. */
        const enterScript = (data: IElementFound) => {
            const { element }: { element: IAsyncHTMLElement } = data;

            if (isJsllDir(element)) {
                if (inHead.includes(currentState)) {
                    currentState = State.apiHead;
                }

                if (inBody.includes(currentState)) {
                    currentState = State.apiBody;
                }
            }

            if (tempInit) {
                validateScript(tempInit);
                tempInit = null;
            }
        };

        /** Handler on entering the head element. */
        const enterHead = () => {
            currentState = State.head;
        };

        /** Handler on entering the body element. */
        const enterBody = async (data: IElementFound) => {
            currentState = State.body;

            const { resource }: { resource: string } = data;

            if (!validated) {
                // Should verify init but no script tag was encountered after the JSLL link.
                // e.g.:
                // <head>
                //      <script src="../jsll-4.js"></script>
                // </head>
                await context.report(resource, null, messages.noInit);
            }
        };

        return {
            'element::body': enterBody,
            'element::head': enterHead,
            'element::script': enterScript,
            'parse::javascript': validateScript
        };
    },
    meta: {
        docs: {
            category: Category.other,
            description: `Validate the use of 'awa.init' to initialize the JSLL script.`
        },
        recommended: false,
        schema: [],
        worksWithLocalFiles: true
    }
};

module.exports = rule;
