@echo off
npm cache clean --force
npm install --legacy-peer-deps > install_output.txt 2>&1
echo DONE
