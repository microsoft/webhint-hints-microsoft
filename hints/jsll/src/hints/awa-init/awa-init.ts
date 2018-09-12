/**
 * @fileoverview Validate the use of `awa.init` to initialize the JSLL script.
 */

import { Category } from 'hint/dist/src/lib/enums/category';
import { HintContext } from 'hint/dist/src/lib/hint-context';
import { IHint, HintMetadata, IAsyncHTMLElement, ElementFound } from 'hint/dist/src/lib/types';
import { ScriptParse } from '@hint/parser-javascript/dist/src/types';
import { debug as d } from 'hint/dist/src/lib/utils/debug';
import { HintScope } from 'hint/dist/src/lib/enums/hintscope';

import { isPotentialInitScript, configIsDefined } from '../validator';
import { isJsllDir, isInitCode } from '../utils';

import { Linter } from 'eslint';

const debug: debug.IDebugger = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

export default class JsllAwaInitRule implements IHint {
    public static readonly meta: HintMetadata = {
        docs: {
            category: Category.other,
            description: `Validate the use of 'awa.init' to initialize the JSLL script.`
        },
        id: 'jsll/awa-init',
        schema: [],
        scope: HintScope.any
    }

    public constructor(context: HintContext) {
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
        let tempInit: ScriptParse;

        linter.defineRule('awa-init', {
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
        const validateScript = async (scriptParse: ScriptParse) => {
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

            const results = linter.verify(sourceCode, { rules: { 'awa-init': 'error' } });

            for (const result of results) {
                await context.report(scriptParse.resource, null, result.message);
            }
        };

        /** Handler on entering a script element: Update state if it's the JSLL api link. */
        const enterScript = (data: ElementFound) => {
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
        const enterBody = async (data: ElementFound) => {
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

        context.on('element::body', enterBody);
        context.on('element::head', enterHead);
        context.on('element::script', enterScript);
        context.on('parse::javascript::end', validateScript);
    }
}
