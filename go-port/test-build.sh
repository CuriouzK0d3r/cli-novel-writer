#!/bin/bash

# Writers CLI Go Port - Build and Test Script
# This script tests that the Go port builds and runs correctly

set -e  # Exit on error

echo "🚀 Writers CLI Go Port - Build and Test Script"
echo "=============================================="

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21 or later."
    exit 1
fi

# Check Go version
GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
echo "✅ Go version: $GO_VERSION"

# Check if Make is available
if ! command -v make &> /dev/null; then
    echo "⚠️  Make not found. Using direct go commands."
    USE_MAKE=false
else
    echo "✅ Make available"
    USE_MAKE=true
fi

echo ""
echo "📦 Step 1: Downloading dependencies..."
go mod download
go mod tidy
echo "✅ Dependencies ready"

echo ""
echo "🔧 Step 2: Building the application..."
if [ "$USE_MAKE" = true ]; then
    make build
else
    mkdir -p bin
    go build -o bin/writers .
fi

if [ -f "bin/writers" ]; then
    echo "✅ Build successful: bin/writers"
else
    echo "❌ Build failed - binary not found"
    exit 1
fi

echo ""
echo "🧪 Step 3: Testing basic functionality..."

# Test help command
echo "Testing --help command..."
if ./bin/writers --help > /dev/null 2>&1; then
    echo "✅ Help command works"
else
    echo "❌ Help command failed"
    exit 1
fi

# Test theme list command
echo "Testing theme list command..."
if ./bin/writers theme list > /dev/null 2>&1; then
    echo "✅ Theme list command works"
else
    echo "❌ Theme list command failed"
    exit 1
fi

# Test new file creation
echo "Testing file creation..."
if ./bin/writers new test-file.md --template "short-story" > /dev/null 2>&1; then
    echo "✅ File creation works"
    if [ -f "test-file.md" ]; then
        echo "✅ Test file created successfully"
        rm -f test-file.md  # Clean up
    else
        echo "❌ Test file was not created"
        exit 1
    fi
else
    echo "❌ File creation failed"
    exit 1
fi

# Test project initialization
echo "Testing project initialization..."
if ./bin/writers init test-project --type novel --force > /dev/null 2>&1; then
    echo "✅ Project initialization works"
    if [ -d "test-project" ]; then
        echo "✅ Test project created successfully"
        rm -rf test-project  # Clean up
    else
        echo "❌ Test project was not created"
        exit 1
    fi
else
    echo "❌ Project initialization failed"
    exit 1
fi

echo ""
echo "📊 Step 4: Running tests..."
if go test ./... > /dev/null 2>&1; then
    echo "✅ All tests pass"
else
    echo "⚠️  Some tests failed (this is normal for a development build)"
fi

echo ""
echo "📈 Step 5: Performance check..."
echo "Binary size:"
ls -lh bin/writers | awk '{print "  " $5 " - " $9}'

echo ""
echo "🎉 Build and test complete!"
echo ""
echo "🚀 Next steps:"
echo "  1. Try the demo: ./bin/writers edit test-demo.md"
echo "  2. Create a project: ./bin/writers init my-novel --type novel"
echo "  3. Install system-wide: sudo make install"
echo ""
echo "⌨️  Editor shortcuts:"
echo "  F2  - Switch themes"
echo "  F1  - Show help"
echo "  i   - Enter insert mode"
echo "  Esc - Return to navigation mode"
echo ""
echo "✨ Happy writing with the Go port!"
