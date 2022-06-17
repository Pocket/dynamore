#!/bin/bash
set -x

TABLE_DEFINITIONS=(
  'test-hash-table' 'test-composite-table' 'test-big-table'
)

for json_file in "${TABLE_DEFINITIONS[@]}"; do
  # start fresh and delete the table if it exists
  awslocal dynamodb delete-table --table-name ${json_file} || true
  awslocal dynamodb create-table --cli-input-json file://$(dirname "${BASH_SOURCE[0]}")/dynamodb/${json_file}.json
  # awslocal dynamodb batch-write-item --request-items file://$(dirname "${BASH_SOURCE[0]}")/dynamodb/${json_file}-seed.json
done


set +x
