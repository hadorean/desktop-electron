# Usage: "just <command> <args>"
# Installation: winget install --id Casey.Just --exact
# Doc: https://github.com/casey/just

default-version := "patch" 

# Development

# Start all (shared, client, electron)
dev:
	clear
	pnpm dev
	
# Start the web client
web:
	clear
	pnpm dev:web

# Start the electron app
app:
	clear
	pnpm dev:app

# Run the installer
run:
	./pkg/app/dist/*.exe

# Run the mkdocs server
doc:
	python -m mkdocs serve

# Build and publishing

# Publish a new version
publish-patch:
	just version
	just publish

# Build the installer
build:
	just move-prev-exe	
	pnpm package:win

# Build and run the installer
build_run:
	just build
	just run

# Build the chrome extension
chrome:
	cd pkg/chrome && pnpm build

# Setup

setup:
	pnpm reinstall

# Generate icons from the logo.svg file in pkg/shared/src/assets/icons
icons:
	pnpm generate-icons

# Type checking

# what = all | shared | client | app
check what="all": 
	clear
	pnpm format --log-level=warn
	pnpm typecheck:ts
	just check-{{what}}
	
check-all:
	just check-shared
	just check-app
	just check-client
	
check-shared:
	pnpm typecheck:shared

check-client:
	pnpm typecheck:client

check-app:
	pnpm typecheck:app

# Linting

# what = all | shared | client | app
lint what="all": 
	clear
	just lint-{{what}}
	
lint-all:
	just lint-shared
	just lint-app
	just lint-client

lint-shared:
	pnpm lint:shared

lint-client:
	pnpm lint:client

lint-app:
	pnpm lint:app

# Shad components library

# Add a shadcn component
shad command="add" component="":
	cd pkg/shadcn && pnpm dlx shadcn-svelte@latest {{command}} {{component}}

# Run the shadcn demo
demo-shad:
	cd pkg/shadcn && pnpm dev

[confirm("Are you sure you want to clean the node_modules (y/n)?")]
clean:
	node scripts/rm_modules.js

# Update the version
# To set version explicitly: publish 1.0.1
# To auto-bump current version: publish patch | minor | major
version version=default-version:
	node scripts/version.js {{version}}
	just squash-last-two

publish:
	just build
	node scripts/publish.js
	
move-prev-exe:
	node scripts/move-prev-exe.js

delete-tags:
	pnpm delete-tags

# Claude

# Monitor the claude agent
monitor:
	claude-monitor --plan pro

# Git

defaultGitCommitLogs := "3"

log count=defaultGitCommitLogs:
	git log --oneline -{{count}}

# Squash the last two commits  
squash-last-two:
    node scripts/squash-last-two.js

# Push to origin
push:
	git push

# Force push to origin
[confirm("Are you sure you want to force push to origin (y/n)?")] # Override with just  --yes force
force:
	git push -f

# Commit message
commit message:
	git add .
	git commit -m "{{message}}"

commit-skip message:
	git commit -m "Unverified:{{message}}" --no-verify

# Amend the last commit and push
[confirm("Are you sure you want to amend the last commit and push (y/n)?")]
amend-push:
	just amend
	git push -f

# Amend the last commit
amend:
	git add .
	git commit --amend --no-edit

# Undo the last commit
[confirm("Are you sure you want to undo the last commit (y/n)?")]
undo:
	git reset HEAD~1

# Reset the current changes
[confirm("Are you sure you want to reset the current changes (y/n)?")]
reset:
	git reset --hard
	git clean -df

# Recover from a bad commit
recover:
	git reflog

split-subtree path, new-branch, subtree-origin="":
	 git subtree split --prefix={{path}} origin {{new-branch}}
	 git remote add subtree-origin {{subtree-origin}}
