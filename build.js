const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const python = path.join(__dirname, 'python', 'python.exe');
const backendScript = path.join(__dirname, 'src', 'start_backend.py');
const backend = spawn(python, [backendScript], {
  cwd: path.join(__dirname, 'src'),
  detached: true,
  stdio: 'ignore'
});
backend.unref();
const { app } = require('electron');
