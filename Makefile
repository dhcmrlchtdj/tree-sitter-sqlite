SHELL := bash
.SHELLFLAGS := -O globstar -e -u -o pipefail -c
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

PATH := ./node_modules/.bin:$(PATH)

###

.PHONY: gen test update_test_snapshot

gen:
	tree-sitter generate

test:
	tree-sitter test

update_test_snapshot:
	tree-sitter test --update

###

.PHONY: fmt
fmt:
	prettier --write .
