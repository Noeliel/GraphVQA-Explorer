#!/bin/sh
# Copied from https://stackoverflow.com/a/11300125
# Modified slightly to write resulting files into thumbnails/ instead
# Requires Imagemagick to be installed on your system

make_thumbnail() {
    pic=$1
    thumb=thumbnails/$(basename "$1")
    convert "$pic" -thumbnail x100 "$thumb"
}

# Now we need a way to call make_thumbnail on each file.
# The easiest robust way is to restrict on files at level 2, and glob those
# with */*.jpg
# (we could also glob levels 2 and 3 with two globs: */*.jpg */*/*.jpg)

mkdir -p thumbnails/
for pic in images/*.jpg
do
    make_thumbnail "$pic"
done
