import generateHTMLPage from 'hint/dist/src/lib/utils/misc/generate-html-page';
import { HintTest } from '@hint/utils-tests-helpers/dist/src/hint-test-type';
import * as hintRunner from '@hint/utils-tests-helpers/dist/src/hint-runner';

const hintName = 'chisel';

const html = {
    missingLang: `<!doctype html>
    <html>
       <head>
           <title>test</title>
       </head>
       <body>
       </body>
   </html>`,
    noProblems: generateHTMLPage()
};

const tests: Array<HintTest> = [
    {
        name: `Page doesn't have any a11y problems and passes`,
        serverConfig: html.noProblems
    },
    {
        name: `HTML is missing the lang attribute and fails`,
        reports: [{ message: '<html> element must have a lang attribute' }],
        serverConfig: html.missingLang
    }
];

const testsWithCustomConfiguration: Array<HintTest> = [
    {
        name: `Page doesn't have any a11y problems and passes`,
        serverConfig: html.noProblems
    },
    {
        name: `HTML is missing the lang attribute and passes because of custom config`,
        serverConfig: html.missingLang
    }
];

const testsWithOverridenConfiguration: Array<HintTest> = [
    {
        name: `Page doesn't have any a11y problems and passes, but warns about the overriden config setting`,
        reports: [{ message: 'exclude is ignored when selector is set.' }],
        serverConfig: html.noProblems
    },
    {
        name: `HTML is missing the lang attribute and fails, and warns about the overriden config setting`,
        reports: [{ message: 'exclude is ignored when selector is set.' }, { message: '<html> element must have a lang attribute' }],
        serverConfig: html.missingLang
    }
];

hintRunner.testHint(hintName, tests);
hintRunner.testHint(hintName, testsWithCustomConfiguration, { hintOptions: { testsToRun: ['color-contrast'] } });
hintRunner.testHint(hintName, testsWithOverridenConfiguration, {
    hintOptions: {
        exclude: ['html'],
        selector: 'html'
    }
});
