@echo off
echo Starting local server at http://localhost:3000
echo.
echo  index.html   -> http://localhost:3000/index.html
echo  crm.html     -> http://localhost:3000/crm.html
echo  desktop.html -> http://localhost:3000/desktop.html
echo.
echo Press Ctrl+C to stop the server.
echo.
start "" "http://localhost:3000/index.html"
python -m http.server 3000
