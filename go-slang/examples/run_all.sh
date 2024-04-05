#!/bin/bash

for file in *.go
do
  # remove the .go extension
  file="${file%.*}"
  npx ts-node run.ts < $file.go > $file.out
done
