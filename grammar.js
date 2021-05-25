const { statement } = require("./grammar/statement")
const { part } = require("./grammar/part")
const { token } = require("./grammar/token")

module.exports = grammar({
    name: "sqlite",
    extras: ($) => [$._whitespace, $.comment],

    precedences: ($) => [
        [
            "unary_bitnot",
            "unary_plus",
            "expr_collate",
            "binary_concat",
            "binary_times",
            "binary_plus",
            "binary_bitwise",
            "binary_compare",
            "binary_relation",
            "expr_not_exists",
            "expr_exists",
            "unary_not",
            "binary_and",
            "binary_or",
        ],
    ],

    conflicts: ($) => [
        [$._literal_value, $._name],
        [$._literal_value, $.signed_number],
        [$.insert_stmt, $._select_core],
        [$.foreign_key_clause],
    ],

    // word: ($) => $.identifier,

    rules: {
        sql_stmt_list: ($) =>
            seq(optional($.sql_stmt), repeat(seq(";", optional($.sql_stmt)))),
        ...token,
        ...part,
        ...statement,
    },
})
