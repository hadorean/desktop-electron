# Usage: "just <command> <args>"
# Installation: winget install --id Casey.Just --exact
# Doc: https://github.com/casey/just

default-version := "patch" 

dev:
	clear
	pnpm dev

# Run the mkdocs server
doc:
	python -m mkdocs serve

run:
	./pkg/app/dist/*.exe

[confirm("Are you sure you want to clean the node_modules (y/n)?")]
clean:
	node scripts/rm_modules.js

# Publish a new version
publish-patch:
	just version
	just build
	just publish

build:
	just move-prev-exe	
	pnpm package:win

build_run:
	just build
	just run

# Update the version
# To set version explicitly: publish 1.0.1
# To auto-bump current version: publish patch | minor | major
version version=default-version:
	node scripts/version.js {{version}}

publish:
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
