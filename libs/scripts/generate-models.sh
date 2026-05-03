#!/bin/bash
set -e

echo "Generating models from Protocol Buffers..."

# Create output directories
mkdir -p ../generated/typescript
mkdir -p ../generated/dart
mkdir -p ../generated/python

# Generate TypeScript models (for NestJS backend)
npx protoc \
  --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=../generated/typescript \
  --ts_proto_opt=outputServices=grpc-js,env=node,useOptionals=true,exportCommonSymbols=false,esModuleInterop=true \
  -I=../proto \
  ../proto/*.proto

# Generate Dart models (for Flutter frontend)
protoc \
  --dart_out=grpc:../generated/dart \
  -I=../proto \
  ../proto/*.proto

# Generate Python models (for future ML/analytics)
python -m grpc_tools.protoc \
  --python_out=../generated/python \
  --grpc_python_out=../generated/python \
  --mypy_out=../generated/python \
  -I=../proto \
  ../proto/*.proto

echo "All models generated successfully!"
echo "TypeScript: libs/generated/typescript/"
echo "Dart: libs/generated/dart/"
echo "Python: libs/generated/python/"