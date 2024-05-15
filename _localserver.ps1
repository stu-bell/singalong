# run `npm run build` to output the singalong build directory
Start-Process -FilePath "http://localhost:8080/singalong"
python -m http.server 8080