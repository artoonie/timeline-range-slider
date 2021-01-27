#!/bin/bash

# Sanity check
if [ ! -z "$(git status --porcelain)" ]; then 
  echo "Shouldn't be dirty at the start - please commit your changes."
  exit -1
fi

# Once to ensure there's no changes
python3 docs/generate-readme.py

if [ -z "$(git status --porcelain)" ]; then 
  echo "README and github pages is up-to-date!"
else 
  echo "Found unexpected changes - aborting"
  exit -1
fi
