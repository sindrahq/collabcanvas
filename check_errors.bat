@echo off
npx tsc --noEmit > tsc_out.txt 2>&1
npx eslint . > lint_out.txt 2>&1
