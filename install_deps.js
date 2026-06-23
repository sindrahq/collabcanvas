const { exec } = require('child_process');
const fs = require('fs');

exec('npm.cmd install', (error, stdout, stderr) => {
  fs.writeFileSync('npm_out.txt', stdout || '');
  fs.writeFileSync('npm_err.txt', stderr || '');
  if (error) {
    fs.writeFileSync('npm_error.txt', error.toString());
  } else {
    fs.writeFileSync('npm_error.txt', 'SUCCESS');
  }
});
