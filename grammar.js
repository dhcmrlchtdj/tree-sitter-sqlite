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

    word: ($) => $._word,

    rules: {
        sql_stmt_list: ($) =>
            seq(optional($.sql_stmt), repeat(seq(";", optional($.sql_stmt)))),

        /// keyword

        ...generateKeyword([
            "ABORT",
            "ACTION",
            "ADD",
            "AFTER",
            "ALL",
            "ALTER",
            "ALWAYS",
            "ANALYZE",
            "AND",
            "AS",
            "ASC",
            "ATTACH",
            "AUTOINCREMENT",
            "BEFORE",
            "BEGIN",
            "BETWEEN",
            "BY",
            "CASCADE",
            "CASE",
            "CAST",
            "CHECK",
            "COLLATE",
            "COLUMN",
            "COMMIT",
            "CONFLICT",
            "CONSTRAINT",
            "CREATE",
            "CROSS",
            "CURRENT",
            "CURRENT_DATE",
            "CURRENT_TIME",
            "CURRENT_TIMESTAMP",
            "DATABASE",
            "DEFAULT",
            "DEFERRABLE",
            "DEFERRED",
            "DELETE",
            "DESC",
            "DETACH",
            "DISTINCT",
            "DO",
            "DROP",
            "EACH",
            "ELSE",
            "END",
            "ESCAPE",
            "EXCEPT",
            "EXCLUDE",
            "EXCLUSIVE",
            "EXISTS",
            "EXPLAIN",
            "FAIL",
            "FALSE",
            "FILTER",
            "FIRST",
            "FOLLOWING",
            "FOR",
            "FOREIGN",
            "FROM",
            "GENERATED",
            "GLOB",
            "GROUP",
            "GROUPS",
            "HAVING",
            "IF",
            "IGNORE",
            "IMMEDIATE",
            "IN",
            "INDEX",
            "INDEXED",
            "INITIALLY",
            "INNER",
            "INSERT",
            "INSTEAD",
            "INTERSECT",
            "INTO",
            "IS",
            "ISNULL",
            "JOIN",
            "KEY",
            "LAST",
            "LEFT",
            "LIKE",
            "LIMIT",
            "MATCH",
            "MATERIALIZED",
            "NATURAL",
            "NO",
            "NOT",
            "NOTHING",
            "NOTNULL",
            "NULL",
            "NULLS",
            "OF",
            "OFFSET",
            "ON",
            "OR",
            "ORDER",
            "OTHERS",
            "OUTER",
            "OVER",
            "PARTITION",
            "PLAN",
            "PRAGMA",
            "PRECEDING",
            "PRIMARY",
            "QUERY",
            "RAISE",
            "RANGE",
            "RECURSIVE",
            "REFERENCES",
            "REGEXP",
            "REINDEX",
            "RELEASE",
            "RENAME",
            "REPLACE",
            "RESTRICT",
            "RETURNING",
            "ROLLBACK",
            "ROW",
            "ROWID",
            "ROWS",
            "SAVEPOINT",
            "SELECT",
            "SET",
            "STORED",
            "TABLE",
            "TEMP",
            "TEMPORARY",
            "THEN",
            "TIES",
            "TO",
            "TRANSACTION",
            "TRIGGER",
            "TRUE",
            "UNBOUNDED",
            "UNION",
            "UNIQUE",
            "UPDATE",
            "USING",
            "VACUUM",
            "VALUES",
            "VIEW",
            "VIRTUAL",
            "WHEN",
            "WHERE",
            "WINDOW",
            "WITH",
            "WITHOUT",
        ]),

        /// token

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

        identifier: ($) =>
            choice(
                /[_a-zA-Z\x80-\xFF][$_0-9a-zA-Z\x80-\xFF]*/,
                seq('"', /(""|[^"])*/, '"'),
                seq("`", /(``|[^`])*/, "`"),
                seq("[", /[^\]]*/, "]"),
            ),

        bind_parameter: ($) =>
            choice(
                seq("?", repeat(/[0-9]/)),
                seq(choice("@", "$", ":", "#"), /[$_0-9a-zA-Z\x80-\xFF]+/),
            ),

        // https://github.com/tree-sitter/tree-sitter-javascript/blob/v0.19.0/grammar.js#L888
        comment: ($) =>
            choice(seq("--", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

        /// statement

        sql_stmt: ($) =>
            seq(
                optional(seq($.EXPLAIN, optional(seq($.QUERY, $.PLAN)))),
                choice(
                    $.alter_table_stmt,
                    $.analyze_stmt,
                    $.attach_stmt,
                    $.begin_stmt,
                    $.commit_stmt,
                    $.create_index_stmt,
                    $.create_table_stmt,
                    $.create_trigger_stmt,
                    $.create_view_stmt,
                    $.create_virtual_table_stmt,
                    $.delete_stmt,
                    $.detach_stmt,
                    $.drop_index_stmt,
                    $.drop_table_stmt,
                    $.drop_trigger_stmt,
                    $.drop_view_stmt,
                    $.insert_stmt,
                    $.pragma_stmt,
                    $.reindex_stmt,
                    $.release_stmt,
                    $.rollback_stmt,
                    $.savepoint_stmt,
                    $.select_stmt,
                    $.update_stmt,
                    $.vacuum_stmt,
                ),
            ),

        alter_table_stmt: ($) =>
            seq(
                $.ALTER,
                $.TABLE,
                $._name2,
                choice(
                    seq($.RENAME, $.TO, $._name),
                    seq($.RENAME, optional($.COLUMN), $._name, $.TO, $._name),
                    seq($.ADD, optional($.COLUMN), $.column_def),
                    seq($.DROP, optional($.COLUMN), $._name),
                ),
            ),

        analyze_stmt: ($) => seq($.ANALYZE, optional($._name2)),

        attach_stmt: ($) =>
            seq($.ATTACH, optional($.DATABASE), $._expr, $.AS, $._name),

        begin_stmt: ($) =>
            seq(
                $.BEGIN,
                optional(choice($.DEFERRED, $.IMMEDIATE, $.EXCLUSIVE)),
                optional(seq($.TRANSACTION, optional($._name))),
            ),

        commit_stmt: ($) =>
            seq(
                choice($.COMMIT, $.END),
                optional(seq($.TRANSACTION, optional($._name))),
            ),

        create_index_stmt: ($) =>
            seq(
                $.CREATE,
                optional($.UNIQUE),
                $.INDEX,
                optional(seq($.IF, $.NOT, $.EXISTS)),
                $._name2,
                $.ON,
                $._name,
                "(",
                commaSep($.indexed_column),
                ")",
                optional($.where_clause),
            ),

        create_table_stmt: ($) =>
            seq(
                $.CREATE,
                optional(choice($.TEMP, $.TEMPORARY)),
                $.TABLE,
                optional(seq($.IF, $.NOT, $.EXISTS)),
                $._name2,
                choice(
                    seq($.AS, $.select_stmt),
                    seq(
                        "(",
                        commaSep($.column_def),
                        repeat(seq(",", $.table_constraint)),
                        ")",
                        optional(seq($.WITHOUT, $.ROWID)),
                    ),
                ),
            ),

        create_trigger_stmt: ($) =>
            seq(
                $.CREATE,
                optional(choice($.TEMP, $.TEMPORARY)),
                $.TRIGGER,
                optional(seq($.IF, $.NOT, $.EXISTS)),
                $._name2,
                optional(choice($.BEFORE, $.AFTER, seq($.INSTEAD, $.OF))),
                choice(
                    $.DELETE,
                    $.INSERT,
                    seq($.UPDATE, optional(seq($.OF, commaSep($._name)))),
                ),
                $.ON,
                $._name,
                optional(
                    choice(
                        seq(
                            $.FOR,
                            $.EACH,
                            $.ROW,
                            optional(seq($.WHEN, $._expr)),
                        ),
                        seq($.WHEN, $._expr),
                    ),
                ),
                $.BEGIN,
                repeat1(
                    seq(
                        choice(
                            $.update_stmt,
                            $.insert_stmt,
                            $.delete_stmt,
                            $.select_stmt,
                        ),
                        ";",
                    ),
                ),
                $.END,
            ),

        create_view_stmt: ($) =>
            seq(
                $.CREATE,
                optional(choice($.TEMP, $.TEMPORARY)),
                $.VIEW,
                optional(seq($.IF, $.NOT, $.EXISTS)),
                $._name2,
                optional(seq("(", commaSep($._name), ")")),
                $.AS,
                $.select_stmt,
            ),

        create_virtual_table_stmt: ($) =>
            seq(
                $.CREATE,
                $.VIRTUAL,
                $.TABLE,
                optional(seq($.IF, $.NOT, $.EXISTS)),
                $._name2,
                $.USING,
                $._name,
                optional(
                    // https://sqlite.org/lang_createvtab.html
                    seq(
                        "(",
                        commaSep($.column_def),
                        repeat(seq(",", $.table_constraint)),
                        ")",
                    ),
                ),
            ),

        delete_stmt: ($) =>
            seq(
                optional($.with_clause),
                $.DELETE,
                $.FROM,
                $.qualified_table_name,
                optional($.where_clause),
                optional($.returning_clause),
                optional($.order_by_clause),
                optional($.limit_clause),
            ),

        detach_stmt: ($) => seq($.DETACH, optional($.DATABASE), $._name),

        drop_index_stmt: ($) =>
            seq($.DROP, $.INDEX, optional(seq($.IF, $.EXISTS)), $._name2),

        drop_table_stmt: ($) =>
            seq($.DROP, $.TABLE, optional(seq($.IF, $.EXISTS)), $._name2),

        drop_trigger_stmt: ($) =>
            seq($.DROP, $.TRIGGER, optional(seq($.IF, $.EXISTS)), $._name2),

        drop_view_stmt: ($) =>
            seq($.DROP, $.VIEW, optional(seq($.IF, $.EXISTS)), $._name2),

        insert_stmt: ($) =>
            seq(
                optional($.with_clause),
                choice(
                    $.REPLACE,
                    seq(
                        $.INSERT,
                        optional(
                            seq(
                                $.OR,
                                choice(
                                    $.ABORT,
                                    $.FAIL,
                                    $.IGNORE,
                                    $.REPLACE,
                                    $.ROLLBACK,
                                ),
                            ),
                        ),
                    ),
                ),
                $.INTO,
                $._name2,
                optional(seq($.AS, $._name)),
                optional(seq("(", commaSep($._name), ")")),
                choice(
                    seq(
                        $.VALUES,
                        commaSep(seq("(", commaSep($._expr), ")")),
                        optional($.upsert_clause),
                    ),
                    seq($.select_stmt, optional($.upsert_clause)),
                    seq($.DEFAULT, $.VALUES),
                ),
                optional($.returning_clause),
            ),

        pragma_stmt: ($) =>
            seq(
                $.PRAGMA,
                $._name2,
                optional(
                    choice(
                        seq("=", $.pragma_value),
                        seq("(", $.pragma_value, ")"),
                    ),
                ),
            ),

        reindex_stmt: ($) => seq($.REINDEX, optional($._name2)),

        release_stmt: ($) => seq($.RELEASE, optional($.SAVEPOINT), $._name),

        rollback_stmt: ($) =>
            seq(
                $.ROLLBACK,
                optional(seq($.TRANSACTION, optional($._name))),
                optional(seq($.TO, optional($.SAVEPOINT), $._name)),
            ),

        savepoint_stmt: ($) => seq($.SAVEPOINT, $._name),

        select_stmt: ($) =>
            seq(
                optional($.with_clause),
                $._select_core,
                repeat(seq($._compound_operator, $._select_core)),
                optional($.order_by_clause),
                optional($.limit_clause),
            ),

        update_stmt: ($) =>
            seq(
                optional($.with_clause),
                $.UPDATE,
                optional(
                    seq(
                        $.OR,
                        choice(
                            $.ABORT,
                            $.FAIL,
                            $.IGNORE,
                            $.REPLACE,
                            $.ROLLBACK,
                        ),
                    ),
                ),
                $.qualified_table_name,
                $.SET,
                commaSep(
                    seq(choice($._name, $._column_name_list), "=", $._expr),
                ),
                optional($.from_clause),
                optional($.where_clause),
                optional($.returning_clause),
                optional($.order_by_clause),
                optional($.limit_clause),
            ),

        vacuum_stmt: ($) =>
            seq($.VACUUM, optional($._name), optional(seq($.INTO, $.filename))),

        /// part

        _name: ($) => choice($.string_literal, $.identifier),

        _name2: ($) => seq(optional(seq($._name, ".")), $._name),

        function_name: ($) => $.identifier,

        collation_name: ($) => choice($.string_literal, $.identifier),

        error_message: ($) => $._name,

        pragma_value: ($) => choice($.signed_number, $._name),

        filename: ($) => $._expr,

        _literal_value: ($) =>
            choice(
                $.numeric_literal,
                $.string_literal,
                $.blob_literal,
                $.NULL,
                $.TRUE,
                $.FALSE,
                $.CURRENT_TIME,
                $.CURRENT_DATE,
                $.CURRENT_TIMESTAMP,
            ),

        _expr: ($) =>
            choice(
                $._literal_value,
                $.bind_parameter,
                $._name,
                seq($._name, ".", $._name),
                seq($._name, ".", $._name, ".", $._name),
                prec.right("unary_bitnot", seq("~", $._expr)),
                prec.right("unary_plus", seq(choice("-", "+"), $._expr)),
                prec.right("unary_not", seq($.NOT, $._expr)),
                prec.left("binary_concat", seq($._expr, "||", $._expr)),
                prec.left(
                    "binary_times",
                    seq($._expr, choice("*", "/", "%"), $._expr),
                ),
                prec.left(
                    "binary_plus",
                    seq($._expr, choice("+", "-"), $._expr),
                ),
                prec.left(
                    "binary_bitwise",
                    seq($._expr, choice("<<", ">>", "&", "|"), $._expr),
                ),
                prec.left(
                    "binary_compare",
                    seq($._expr, choice("<", "<=", ">", ">="), $._expr),
                ),
                prec.left(
                    "binary_relation",
                    seq($._expr, choice("=", "==", "!=", "<>"), $._expr),
                ),
                seq(
                    $._expr,
                    optional($.NOT),
                    $.IN,
                    choice(
                        seq(
                            "(",
                            optional(choice($.select_stmt, commaSep($._expr))),
                            ")",
                        ),
                        seq(
                            $._name2,
                            optional(
                                seq("(", optional(commaSep($._expr)), ")"),
                            ),
                        ),
                    ),
                ),
                prec.left("binary_and", seq($._expr, $.AND, $._expr)),
                prec.left("binary_or", seq($._expr, $.OR, $._expr)),
                seq(
                    $.function_name,
                    "(",
                    optional(
                        choice(
                            seq(optional($.DISTINCT), commaSep($._expr)),
                            "*",
                        ),
                    ),
                    ")",
                    optional($.filter_clause),
                    optional($.over_clause),
                ),
                seq("(", commaSep($._expr), ")"),
                seq($.CAST, "(", $._expr, $.AS, $.type_name, ")"),
                prec("expr_collate", seq($._expr, $.COLLATE, $.collation_name)),
                prec.left(
                    "binary_relation",
                    seq(
                        $._expr,
                        optional($.NOT),
                        choice($.LIKE, $.GLOB, $.REGEXP, $.MATCH),
                        $._expr,
                        optional(seq($.ESCAPE, $._expr)),
                    ),
                ),
                seq($._expr, choice($.ISNULL, $.NOTNULL, seq($.NOT, $.NULL))),
                prec.left(
                    "binary_relation",
                    seq($._expr, $.IS, optional($.NOT), $._expr),
                ),
                prec.left(
                    "binary_relation",
                    seq(
                        $._expr,
                        optional($.NOT),
                        $.BETWEEN,
                        $._expr,
                        $.AND,
                        $._expr,
                    ),
                ),
                seq("(", $.select_stmt, ")"),
                prec("expr_exists", seq($.EXISTS, "(", $.select_stmt, ")")),
                prec(
                    "expr_not_exists",
                    seq($.NOT, $.EXISTS, "(", $.select_stmt, ")"),
                ),
                seq(
                    $.CASE,
                    optional($._expr),
                    repeat1(seq($.WHEN, $._expr, $.THEN, $._expr)),
                    optional(seq($.ELSE, $._expr)),
                    $.END,
                ),
                $.raise_function,
            ),

        signed_number: ($) =>
            seq(optional(choice("+", "-")), $.numeric_literal),

        indexed_column: ($) => seq($._expr, optional(choice($.ASC, $.DESC))),

        column_def: ($) =>
            seq($._name, optional($.type_name), repeat($.column_constraint)),

        type_name: ($) =>
            seq(
                repeat1($._name),
                optional(
                    choice(
                        seq("(", $.signed_number, ")"),
                        seq("(", $.signed_number, ",", $.signed_number, ")"),
                    ),
                ),
            ),

        column_constraint: ($) =>
            seq(
                optional(seq($.CONSTRAINT, $._name)),
                choice(
                    seq(
                        $.PRIMARY,
                        $.KEY,
                        optional(choice($.ASC, $.DESC)),
                        optional($.conflict_clause),
                        optional($.AUTOINCREMENT),
                    ),
                    seq(optional($.NOT), $.NULL, optional($.conflict_clause)),
                    seq($.UNIQUE, optional($.conflict_clause)),
                    seq($.CHECK, "(", $._expr, ")"),
                    seq(
                        $.DEFAULT,
                        choice(
                            seq("(", $._expr, ")"),
                            $._literal_value,
                            $.signed_number,
                        ),
                    ),
                    seq($.COLLATE, $.collation_name),
                    $.foreign_key_clause,
                    seq(
                        optional(seq($.GENERATED, $.ALWAYS)),
                        $.AS,
                        "(",
                        $._expr,
                        ")",
                        optional(choice($.STORED, $.VIRTUAL)),
                    ),
                ),
            ),

        table_constraint: ($) =>
            seq(
                optional(seq($.CONSTRAINT, $._name)),
                choice(
                    seq(
                        choice(seq($.PRIMARY, $.KEY), $.UNIQUE),
                        "(",
                        commaSep($.indexed_column),
                        ")",
                        optional($.conflict_clause),
                    ),
                    seq($.CHECK, "(", $._expr, ")"),
                    seq(
                        $.FOREIGN,
                        $.KEY,
                        "(",
                        commaSep($._name),
                        ")",
                        $.foreign_key_clause,
                    ),
                ),
            ),

        where_clause: ($) => seq($.WHERE, $._expr),

        returning_clause: ($) => seq($.RETURNING, commaSep($._result_column)),

        order_by_clause: ($) => seq($.ORDER, $.BY, commaSep($.ordering_term)),

        limit_clause: ($) =>
            seq(
                $.LIMIT,
                $._expr,
                optional(choice(seq($.OFFSET, $._expr), seq(",", $._expr))),
            ),

        group_by_clause: ($) =>
            seq(
                $.GROUP,
                $.BY,
                commaSep($._expr),
                optional(seq($.HAVING, $._expr)),
            ),

        window_clause: ($) =>
            seq($.WINDOW, commaSep(seq($._name, $.AS, $.window_defn))),

        window_defn: ($) =>
            seq(
                "(",
                optional($._name),
                optional(seq($.PARTITION, $.BY, commaSep($._expr))),
                optional(seq($.ORDER, $.BY, commaSep($.ordering_term))),
                optional($.frame_spec),
                ")",
            ),

        _select_core: ($) =>
            choice(
                seq(
                    $.SELECT,
                    optional(choice($.DISTINCT, $.ALL)),
                    commaSep($._result_column),
                    optional($.from_clause),
                    optional($.where_clause),
                    optional($.group_by_clause),
                    optional($.window_clause),
                ),
                seq($.VALUES, commaSep(seq("(", commaSep($._expr), ")"))),
            ),

        _compound_operator: ($) =>
            choice($.UNION, seq($.UNION, $.ALL), $.INTERSECT, $.EXCEPT),

        _result_column: ($) =>
            choice(
                seq($._name, ".", "*"),
                "*",
                seq($._expr, optional(seq(optional($.AS), $._name))),
            ),

        with_clause: ($) =>
            seq(
                $.WITH,
                optional($.RECURSIVE),
                commaSep($.common_table_expression),
            ),

        common_table_expression: ($) =>
            seq(
                $._name,
                optional(seq("(", commaSep($._name), ")")),
                $.AS,
                optional(seq(optional($.NOT), $.MATERIALIZED)),
                "(",
                $.select_stmt,
                ")",
            ),

        conflict_clause: ($) =>
            seq(
                $.ON,
                $.CONFLICT,
                choice($.ROLLBACK, $.ABORT, $.FAIL, $.IGNORE, $.REPLACE),
            ),

        foreign_key_clause: ($) =>
            seq(
                $.REFERENCES,
                $._name,
                optional(seq("(", commaSep($._name), ")")),
                repeat(
                    choice(
                        seq(
                            $.ON,
                            choice($.DELETE, $.UPDATE),
                            choice(
                                seq($.SET, $.NULL),
                                seq($.SET, $.DEFAULT),
                                $.CASCADE,
                                $.RESTRICT,
                                seq($.NO, $.ACTION),
                            ),
                        ),
                        seq($.MATCH, $._name),
                    ),
                ),
                optional(
                    seq(
                        optional($.NOT),
                        $.DEFERRABLE,
                        optional(
                            choice(
                                seq($.INITIALLY, $.DEFERRED),
                                seq($.INITIALLY, $.IMMEDIATE),
                            ),
                        ),
                    ),
                ),
            ),

        filter_clause: ($) => seq($.FILTER, "(", $.WHERE, $._expr, ")"),

        over_clause: ($) =>
            seq(
                $.OVER,
                choice(
                    $._name,
                    seq(
                        "(",
                        optional($._name),
                        optional(seq($.PARTITION, $.BY, commaSep($._expr))),
                        optional(seq($.ORDER, $.BY, commaSep($.ordering_term))),
                        optional($.frame_spec),
                        ")",
                    ),
                ),
            ),

        raise_function: ($) =>
            seq(
                $.RAISE,
                "(",
                choice(
                    $.IGNORE,
                    seq(
                        choice($.ROLLBACK, $.ABORT, $.FAIL),
                        ",",
                        $.error_message,
                    ),
                ),
                ")",
            ),

        ordering_term: ($) =>
            seq(
                $._expr,
                optional(choice($.ASC, $.DESC)),
                optional(seq($.NULLS, choice($.FIRST, $.LAST))),
            ),

        frame_spec: ($) =>
            seq(
                choice($.RANGE, $.ROWS, $.GROUPS),
                choice(
                    seq(
                        $.BETWEEN,
                        choice(
                            seq($.UNBOUNDED, $.PRECEDING),
                            seq($._expr, $.PRECEDING),
                            seq($.CURRENT, $.ROW),
                            seq($._expr, $.FOLLOWING),
                        ),
                        $.AND,
                        choice(
                            seq($._expr, $.PRECEDING),
                            seq($.CURRENT, $.ROW),
                            seq($._expr, $.FOLLOWING),
                            seq($.UNBOUNDED, $.FOLLOWING),
                        ),
                    ),
                    seq($.UNBOUNDED, $.PRECEDING),
                    seq($._expr, $.PRECEDING),
                    seq($.CURRENT, $.ROW),
                ),
                optional(
                    seq(
                        $.EXCLUDE,
                        choice(
                            seq($.NOT, $.OTHERS),
                            seq($.CURRENT, $.ROW),
                            $.GROUP,
                            $.TIES,
                        ),
                    ),
                ),
            ),

        _column_name_list: ($) => seq("(", commaSep($._name), ")"),

        qualified_table_name: ($) =>
            seq(
                $._name2,
                optional(seq($.AS, $._name)),
                optional(
                    choice(
                        seq($.INDEXED, $.BY, $._name),
                        seq($.NOT, $.INDEXED),
                    ),
                ),
            ),

        from_clause: ($) => seq($.FROM, $._join_clause),

        _join_clause: ($) =>
            seq(
                $.table_or_subquery,
                repeat(
                    seq(
                        $.join_operator,
                        $.table_or_subquery,
                        optional($.join_constraint),
                    ),
                ),
            ),

        join_operator: ($) =>
            choice(
                ",",
                seq(
                    optional($.NATURAL),
                    optional(
                        choice(
                            seq($.LEFT, optional($.OUTER)),
                            $.INNER,
                            $.CROSS,
                        ),
                    ),
                    $.JOIN,
                ),
            ),

        join_constraint: ($) =>
            choice(
                seq($.ON, $._expr),
                seq($.USING, "(", commaSep($._name), ")"),
            ),

        table_or_subquery: ($) =>
            choice(
                seq(
                    $._name2,
                    optional(seq(optional($.AS), $._name)),
                    optional(
                        choice(
                            seq($.INDEXED, $.BY, $._name),
                            seq($.NOT, $.INDEXED),
                        ),
                    ),
                ),
                seq(
                    $._name2,
                    "(",
                    commaSep($._expr),
                    ")",
                    optional(seq(optional($.AS), $._name)),
                ),
                seq(
                    "(",
                    $.select_stmt,
                    ")",
                    optional(seq(optional($.AS), $._name)),
                ),
                seq("(", $._join_clause, ")"),
            ),

        upsert_clause: ($) =>
            seq(
                $.ON,
                $.CONFLICT,
                optional(
                    seq(
                        "(",
                        commaSep($.indexed_column),
                        ")",
                        optional($.where_clause),
                    ),
                ),
                $.DO,
                choice(
                    $.NOTHING,
                    seq(
                        $.UPDATE,
                        $.SET,
                        commaSep(
                            seq(
                                choice($._name, $._column_name_list),
                                "=",
                                $._expr,
                            ),
                        ),
                        optional($.where_clause),
                    ),
                ),
            ),

        _word: ($) => /[_a-zA-Z\x80-\xFF$@#:?][$_0-9a-zA-Z\x80-\xFF]*/,
    },
})

function generateKeyword(keywords) {
    const kw = {}
    keywords.forEach((w) => {
        kw[w.toUpperCase()] = ($) =>
            new RegExp(
                Array.from(w)
                    .map((c) => "[" + c.toLowerCase() + c.toUpperCase() + "]")
                    .join(""),
            )
    })
    return kw
}

function commaSep(rule) {
    return seq(rule, repeat(seq(",", rule)))
}
