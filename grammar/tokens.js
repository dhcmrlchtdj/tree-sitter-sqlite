exports.tokens = {
    _whitespace: ($) => /[ \t\n\f\r]+/,

    numeric_literal: ($) => {
        const decimal_digit = /[0-9]+/
        const exponent_part = seq(
            choice("e", "E"),
            optional(choice("-", "+")),
            decimal_digit,
        )
        const decimal_integer_literal = choice(
            "0",
            seq(/[1-9]/, optional(decimal_digit)),
        )
        const decimal_literal = choice(
            seq(
                decimal_integer_literal,
                optional(seq(".", optional(decimal_digit))),
                optional(exponent_part),
            ),
            seq(".", optional(decimal_digit), optional(exponent_part)),
        )

        const hex_literal = seq(choice("0x", "0X"), /[0-9a-fA-F]+/)

        return token(choice(decimal_literal, hex_literal))
    },

    _string: ($) => seq("'", /(''|[^'])*/, "'"),

    string_literal: ($) => $._string,

    blob_literal: ($) => seq(choice("x", "X"), $._string),

    _identifier: ($) =>
        choice(
            /[a-zA-Z_][0-9a-zA-Z_$]*/,
            seq('"', /(""|[^"])*/, '"'),
            seq("`", /(``|[^`])*/, "`"),
            seq("[", /[^\]]*/, "]"),
        ),

    identifier: ($) => $._identifier,

    bind_parameter: ($) =>
        choice(seq("?", /[0-9]*/), seq(choice(":", "@", "$"), $._identifier)),

    // https://github.com/tree-sitter/tree-sitter-javascript/blob/v0.19.0/grammar.js#L888
    comment: ($) =>
        choice(seq("--", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
}
