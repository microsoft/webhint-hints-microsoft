/**
 * @fileoverview Validate the initialization of the JSLL script.
 */

module.exports = {
    'validate-awa-init': require('./rules/validate-awa-init/validate-awa-init'),
    'validate-optional-config': require('./rules/validate-optional-config/validate-optional-config'),
    'validate-required-config': require('./rules/validate-required-config/validate-required-config')
};
