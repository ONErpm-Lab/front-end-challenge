#!/bin/bash

#!/bin/bash


# Run backend in background
echo "Starting project..."
cd ./backend
node ./src/app.js &

# Run frontend in backgroud
cd ../frontend
ng serve --open &