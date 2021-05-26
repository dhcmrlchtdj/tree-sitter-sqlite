exports.part = {
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
            prec.left("binary_plus", seq($._expr, choice("+", "-"), $._expr)),
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
                        optional(seq("(", optional(commaSep($._expr)), ")")),
                    ),
                ),
            ),
            prec.left("binary_and", seq($._expr, $.AND, $._expr)),
            prec.left("binary_or", seq($._expr, $.OR, $._expr)),
            seq(
                $.function_name,
                "(",
                optional(
                    choice(seq(optional($.DISTINCT), commaSep($._expr)), "*"),
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

    signed_number: ($) => seq(optional(choice("+", "-")), $.numeric_literal),

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
        seq($.GROUP, $.BY, commaSep($._expr), optional(seq($.HAVING, $._expr))),

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
        seq($.WITH, optional($.RECURSIVE), commaSep($.common_table_expression)),

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
                seq(choice($.ROLLBACK, $.ABORT, $.FAIL), ",", $.error_message),
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
                choice(seq($.INDEXED, $.BY, $._name), seq($.NOT, $.INDEXED)),
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
                    choice(seq($.LEFT, optional($.OUTER)), $.INNER, $.CROSS),
                ),
                $.JOIN,
            ),
        ),

    join_constraint: ($) =>
        choice(seq($.ON, $._expr), seq($.USING, "(", commaSep($._name), ")")),

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
                        seq(choice($._name, $._column_name_list), "=", $._expr),
                    ),
                    optional($.where_clause),
                ),
            ),
        ),
}

function commaSep(rule) {
    return seq(rule, repeat(seq(",", rule)))
}
