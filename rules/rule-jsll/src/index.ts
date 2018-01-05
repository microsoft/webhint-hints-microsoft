/**
 * @fileoverview Validate the initialization of the JSLL script.
 */

module.exports = {
    'validate-awa-init': require('./rules/validate-awa-init/validate-awa-init'),
    'validate-jsll-script-included': require('./rules/validate-jsll-script-included/validate-jsll-script-included'),
    'validate-optional-config': require('./rules/validate-optional-config/validate-optional-config'),
    'validate-required-config': require('./rules/validate-required-config/validate-required-config')
};
