SHELL := bash
PATH := ./node_modules/.bin:$(PATH)

gen: grammar.js
	tree-sitter generate
