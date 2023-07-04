#!/usr/bin/env sh

tmux \
    new-session 'cd client; npm run dockerstart' \; \
    split-window -h 'cd server; $HOME/miniconda3/bin/conda run --no-capture-output -n gqavis python -m flask run -h 0.0.0.0'
