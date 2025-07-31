# Writers CLI Go Port - Makefile

# Variables
BINARY_NAME=writers
MAIN_PACKAGE=.
BUILD_DIR=bin
VERSION?=2.0.0
LDFLAGS=-ldflags "-X main.version=$(VERSION)"

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
GOFMT=$(GOCMD) fmt

.PHONY: all build clean test deps fmt lint run install help

# Default target
all: clean deps fmt build

# Build the application
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PACKAGE)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Build for multiple platforms
build-all: clean deps fmt
	@echo "Building for multiple platforms..."
	@mkdir -p $(BUILD_DIR)

	# Linux
	GOOS=linux GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(MAIN_PACKAGE)
	GOOS=linux GOARCH=arm64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 $(MAIN_PACKAGE)

	# macOS
	GOOS=darwin GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(MAIN_PACKAGE)
	GOOS=darwin GOARCH=arm64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(MAIN_PACKAGE)

	# Windows
	GOOS=windows GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe $(MAIN_PACKAGE)

	@echo "Cross-platform build complete!"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	$(GOCLEAN)
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete"

# Run tests
test:
	@echo "Running tests..."
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	$(GOMOD) download
	$(GOMOD) tidy

# Format code
fmt:
	@echo "Formatting code..."
	$(GOFMT) ./...

# Lint code (requires golangci-lint)
lint:
	@echo "Linting code..."
	@which golangci-lint > /dev/null || (echo "golangci-lint not installed. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; exit 1)
	golangci-lint run

# Run the application
run: build
	@echo "Running $(BINARY_NAME)..."
	./$(BUILD_DIR)/$(BINARY_NAME)

# Run with arguments
run-args: build
	./$(BUILD_DIR)/$(BINARY_NAME) $(ARGS)

# Install to system
install: build
	@echo "Installing $(BINARY_NAME) to system..."
	sudo cp $(BUILD_DIR)/$(BINARY_NAME) /usr/local/bin/
	@echo "Installation complete. You can now use '$(BINARY_NAME)' from anywhere."

# Uninstall from system
uninstall:
	@echo "Uninstalling $(BINARY_NAME)..."
	sudo rm -f /usr/local/bin/$(BINARY_NAME)
	@echo "Uninstall complete"

# Development setup
dev-setup:
	@echo "Setting up development environment..."
	$(GOMOD) download
	@echo "Installing development tools..."
	$(GOGET) github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Development setup complete"

# Quick demo
demo: build
	@echo "Running demo..."
	./$(BUILD_DIR)/$(BINARY_NAME) --help
	@echo ""
	@echo "Try these commands:"
	@echo "  ./$(BUILD_DIR)/$(BINARY_NAME) theme list"
	@echo "  ./$(BUILD_DIR)/$(BINARY_NAME) new demo.md"
	@echo "  ./$(BUILD_DIR)/$(BINARY_NAME) edit demo.md"

# Generate documentation
docs:
	@echo "Generating documentation..."
	@mkdir -p docs
	$(GOCMD) doc -all > docs/api.txt
	@echo "Documentation generated in docs/"

# Benchmark tests
bench:
	@echo "Running benchmarks..."
	$(GOTEST) -bench=. -benchmem ./...

# Check for security vulnerabilities
security:
	@echo "Checking for security vulnerabilities..."
	@which govulncheck > /dev/null || $(GOGET) golang.org/x/vuln/cmd/govulncheck@latest
	govulncheck ./...

# Check module status
mod-status:
	@echo "Module status:"
	$(GOMOD) graph
	@echo ""
	@echo "Available updates:"
	$(GOCMD) list -u -m all

# Update dependencies
update-deps:
	@echo "Updating dependencies..."
	$(GOGET) -u ./...
	$(GOMOD) tidy

# Create release
release: clean test build-all
	@echo "Creating release $(VERSION)..."
	@mkdir -p release
	@cd $(BUILD_DIR) && tar -czf ../release/$(BINARY_NAME)-$(VERSION)-linux-amd64.tar.gz $(BINARY_NAME)-linux-amd64
	@cd $(BUILD_DIR) && tar -czf ../release/$(BINARY_NAME)-$(VERSION)-linux-arm64.tar.gz $(BINARY_NAME)-linux-arm64
	@cd $(BUILD_DIR) && tar -czf ../release/$(BINARY_NAME)-$(VERSION)-darwin-amd64.tar.gz $(BINARY_NAME)-darwin-amd64
	@cd $(BUILD_DIR) && tar -czf ../release/$(BINARY_NAME)-$(VERSION)-darwin-arm64.tar.gz $(BINARY_NAME)-darwin-arm64
	@cd $(BUILD_DIR) && zip ../release/$(BINARY_NAME)-$(VERSION)-windows-amd64.zip $(BINARY_NAME)-windows-amd64.exe
	@echo "Release packages created in release/"

# Show help
help:
	@echo "Writers CLI Go Port - Available Make Targets:"
	@echo ""
	@echo "Building:"
	@echo "  build          Build the application"
	@echo "  build-all      Build for multiple platforms"
	@echo "  clean          Clean build artifacts"
	@echo ""
	@echo "Development:"
	@echo "  dev-setup      Set up development environment"
	@echo "  deps           Download dependencies"
	@echo "  fmt            Format code"
	@echo "  lint           Lint code (requires golangci-lint)"
	@echo ""
	@echo "Testing:"
	@echo "  test           Run tests"
	@echo "  test-coverage  Run tests with coverage report"
	@echo "  bench          Run benchmark tests"
	@echo "  security       Check for security vulnerabilities"
	@echo ""
	@echo "Running:"
	@echo "  run            Build and run the application"
	@echo "  run-args       Run with arguments (use ARGS='...')"
	@echo "  demo           Show a quick demo"
	@echo ""
	@echo "Installation:"
	@echo "  install        Install to system (/usr/local/bin)"
	@echo "  uninstall      Remove from system"
	@echo ""
	@echo "Maintenance:"
	@echo "  update-deps    Update dependencies"
	@echo "  mod-status     Show module status"
	@echo "  docs           Generate documentation"
	@echo "  release        Create release packages"
	@echo ""
	@echo "Examples:"
	@echo "  make build"
	@echo "  make run-args ARGS='edit story.md'"
	@echo "  make test-coverage"
	@echo "  make release VERSION=2.1.0"
