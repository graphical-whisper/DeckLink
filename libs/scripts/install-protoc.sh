#!/bin/bash
set -e

echo "Installing Protocol Buffers compiler..."

# Install protoc
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    PROTOC_VERSION=26.1
    curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v$PROTOC_VERSION/protoc-$PROTOC_VERSION-linux-x86_64.zip
    unzip protoc-$PROTOC_VERSION-linux-x86_64.zip -d $HOME/.local
    rm protoc-$PROTOC_VERSION-linux-x86_64.zip
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install protobuf
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    choco install protoc
fi

# Install plugins
echo "Installing code generation plugins..."

# TypeScript
npm install -g ts-proto

# Dart
dart pub global activate protoc_plugin

# Python
pip install grpcio-tools mypy-protobuf

echo "Protobuf setup complete!"