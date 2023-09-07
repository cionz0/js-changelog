module.exports = {
    parserOptions: {
        ecmaVersion: 2020,
    },
    env: {es6: true, node: true},
    extends: ["eslint:recommended"],
    plugins: ["jsdoc"],
    // settings: {
    //     "jsdoc": {
    //         "tagNamePreference": {
    //             "return": {"message": "please use returns instead"},
    //         },
    //     },
    // },
    rules: {
        // 'no-extra-semi': 0,
        "no-console": 0,
        "indent": ["error", 4, {"SwitchCase": 1}],
        //"brace-style": ["error", "stroustrup", { "allowSingleLine": true }]
        "quotes": ["error", "double"],
        "max-len": [1, {code: 900}],
        "camelcase": [0],
        // "valid-jsdoc": [1],
        "require-jsdoc": [1],
        "new-cap": [1],
        "no-invalid-this": [1],
        "no-undef": [1],
        "prefer-const": [1],
        "guard-for-in": [1],
        "jsdoc/check-access": 1, // Recommended
        "jsdoc/check-alignment": 1, // Recommended
        // "jsdoc/check-examples": 1,
        "jsdoc/check-indentation": [1, {"excludeTags": ["return", "returns", "openapi", "example"]}],
        "jsdoc/check-line-alignment": 1,
        "jsdoc/check-param-names": 1, // Recommended
        "jsdoc/check-property-names": 1, // Recommended
        "jsdoc/check-syntax": 1,
        "jsdoc/check-tag-names": ["warn", {"definedTags": ["project", "return", "openapi", "createdOn"]}], // Recommended
        "jsdoc/check-types": 1, // Recommended
        "jsdoc/check-values": 1, // Recommended
        "jsdoc/empty-tags": 1, // Recommended
        "jsdoc/implements-on-classes": 1, // Recommended
        "jsdoc/match-description": 1,
        "jsdoc/multiline-blocks": 1, // Recommended
        // "jsdoc/newline-after-description": 1, // Recommended
        "jsdoc/no-bad-blocks": 1,
        "jsdoc/no-defaults": 1,
        // "jsdoc/no-missing-syntax": 1,
        "jsdoc/no-multi-asterisks": 1, // Recommended
        // "jsdoc/no-restricted-syntax": 1,
        // "jsdoc/no-types": 1,
        "jsdoc/no-undefined-types": 1, // Recommended
        "jsdoc/require-asterisk-prefix": 1,
        "jsdoc/require-description": 1,
        "jsdoc/require-description-complete-sentence": 1,
        // "jsdoc/require-example": 1,
        // "jsdoc/require-file-overview": 1,
        "jsdoc/require-hyphen-before-param-description": 1,
        "jsdoc/require-jsdoc": 1, // Recommended
        "jsdoc/require-param": 1, // Recommended
        "jsdoc/require-param-description": 1, // Recommended
        "jsdoc/require-param-name": 1, // Recommended
        "jsdoc/require-param-type": 1, // Recommended
        "jsdoc/require-property": 1, // Recommended
        "jsdoc/require-property-description": 1, // Recommended
        "jsdoc/require-property-name": 1, // Recommended
        "jsdoc/require-property-type": 1, // Recommended
        "jsdoc/require-returns": 1, // Recommended
        "jsdoc/require-returns-check": 1, // Recommended
        "jsdoc/require-returns-description": 1, // Recommended
        "jsdoc/require-returns-type": 1, // Recommended
        "jsdoc/require-throws": 1,
        "jsdoc/require-yields": 1, // Recommended
        "jsdoc/require-yields-check": 1, // Recommended
        "jsdoc/sort-tags": 1,
        "jsdoc/tag-lines": 1, // Recommended
        "jsdoc/valid-types": 1, // Recommended
        "valid-jsdoc": [1, {
            "prefer": {
                "return": "returns",
            },
        }],

    },

    ignorePatterns: ["docs/jsdoc/*"],
}
