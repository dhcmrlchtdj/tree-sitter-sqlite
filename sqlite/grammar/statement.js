exports.statement = {
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
                    seq($.FOR, $.EACH, $.ROW, optional(seq($.WHEN, $._expr))),
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
                choice(seq("=", $.pragma_value), seq("(", $.pragma_value, ")")),
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
                    choice($.ABORT, $.FAIL, $.IGNORE, $.REPLACE, $.ROLLBACK),
                ),
            ),
            $.qualified_table_name,
            $.SET,
            commaSep(seq(choice($._name, $._column_name_list), "=", $._expr)),
            optional($.from_clause),
            optional($.where_clause),
            optional($.returning_clause),
            optional($.order_by_clause),
            optional($.limit_clause),
        ),

    vacuum_stmt: ($) =>
        seq($.VACUUM, optional($._name), optional(seq($.INTO, $.filename))),
}

function commaSep(rule) {
    return seq(rule, repeat(seq(",", rule)))
}
