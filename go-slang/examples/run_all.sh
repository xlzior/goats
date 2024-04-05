#!/bin/bash

# Run from the root of the project as:
# ./examples/run_all.sh

yarn build

for file in examples/*.go
do
  # remove the .go extension
  file="${file%.*}"
  node dist/examples/run.js < $file.go > $file.out
done
