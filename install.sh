#!/bin/bash

# Check if ng CLI is installed globally
if command -v ng &> /dev/null; then
  echo "Angular CLI (ng) is already installed."
else
  echo "Angular CLI (ng) is not installed. Installing..."
  npm install -g @angular/cli
fi

# Setup backend
cd ./backend
echo "Setting up backend..."
npm install

# Setup frontend
cd ../frontend
echo "Setting up frontend..."
npm install

echo "Done!"