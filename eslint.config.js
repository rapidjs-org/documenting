module.exports = [
    require("@eslint/js").configs.recommended,
    {
        languageOptions: {
            sourceType: "commonjs"
        },
        rules: {
            "indent": [
                "error",
                "tab",
                {
                    "SwitchCase": 1,
                    "MemberExpression": "off"
                }
            ],
            "no-empty": [
                "error",
                {
                    "allowEmptyCatch": true
                }
            ],
            "prefer-arrow-callback": "error",
            "no-async-promise-executor": "off",
            "no-mixed-spaces-and-tabs": "off",
            "no-irregular-whitespace": "off",
            "no-control-regex": "off"
        }
    }
];
