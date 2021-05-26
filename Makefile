SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

gen:
	tree-sitter generate

test:
	tree-sitter test

update_test_snapshot:
	tree-sitter test --update
