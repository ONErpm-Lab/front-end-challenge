#!/bin/bash

#!/bin/bash

# Run backend in background
cd ./backend
echo "Starting backend..."
node ./src/app.js &
echo "Backend is running!"

# Run frontend in backgroud
cd ../frontend
echo "Starting frontend..."
ng serve --open &
echo "Frontend is running!"