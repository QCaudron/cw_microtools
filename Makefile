.PHONY: help install test

help: ## Show this help message
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install npm dependencies and Playwright browsers
	npm install
	npx playwright install chromium

test: ## Run the full test suite
	npx playwright test
