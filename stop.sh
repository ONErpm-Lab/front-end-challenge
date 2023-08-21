#!/bin/bash

# BACKEND
BACKEND_PORT=3000
BACKEND_PROCESS_ID=$(lsof -t -i :$BACKEND_PORT)

echo "Stopping backend..."

killall -9 node
if [ -z "$BACKEND_PROCCESS_ID" ]; then
  echo "No process found running on port $BACKEND_PORT."
else
  echo "Killing process $BACKEND_PROCCESS_ID running on port $BACKEND_PORT..."
  kill $BACKEND_PROCCESS_ID
fi

pkill -f "node app.js"
echo "Backend stoped!"

# FRONTEND
FRONTEND_PORT=4200
FRONTEND_PROCESS_ID=$(lsof -t -i :$FRONTEND_PORT)

echo "Stopping frontend..."

if [ -z "$BACKEND_PROCCESS_ID" ]; then
  echo "No process found running on port $FRONTEND_PORT."
else
  echo "Killing process $FRONTEND_PROCESS_ID running on port $FRONTEND_PORT..."
  kill $FRONTEND_PROCESS_ID
fi

pkill -f "ng serve"
echo "Frotend stopped!"