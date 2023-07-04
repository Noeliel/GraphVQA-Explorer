#!/usr/bin/env sh

docker run -it --rm -v $(pwd):/gqavis -p 4200:4200 -p 5000:5000 gqavis bash -c "cd /gqavis; ./.split_launch.sh"
