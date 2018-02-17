# bash /Users/user/projects/ow-conv-client/build.sh

zip -r project-codename.zip main.js node_modules package.json

bx wsk action update --kind nodejs:8 -P params.json  project-codename project-codename.zip



