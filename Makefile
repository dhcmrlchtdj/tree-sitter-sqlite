SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

gen:
	tree-sitter generate

test: gen
	tree-sitter test

update_test_snapshot:
	tree-sitter test --update

clean:
	rm -rf ./bindings ./src ./binding.gyp

fmt:
	prettier --write ./grammar ./grammar.js ./package.json

.PHONY: gen test clean fmt
