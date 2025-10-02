# TCCC Rack UI

A KOS UI application for digital rack management, built using the KOS UI SDK with React and TypeScript for displaying multi-screen content with advanced scheduling and synchronization capabilities.

## Overview

TCCC Rack UI is a KOS platform application that manages digital rack displays with multiple screens, supporting both video and image content. Built on the KOS UI SDK, the system provides sophisticated content scheduling, LED control integration, and manufacturing-specific content delivery.

## Architecture

This is a KOS UI application built using:
- **KOS UI SDK** (@kosdev-code): Core platform SDK for building KOS applications
- **Nx**: Monorepo management and build orchestration
- **React 18**: UI framework with hooks and functional components
- **TypeScript**: Type-safe development
- **Emotion**: CSS-in-JS styling solution

## Project Structure

```
tccc-rack-ui/
├── apps/
│   └── tccc-rack-ui/          # Main KOS React application
├── libs/
│   ├── tccc-rack-models/      # Core data models (Rack, Screen, Bundle)
│   └── model-components/      # React components for model visualization
├── tools/                     # Build scripts and utilities
└── dist/                      # Build output directory
```

### Key Libraries

- **tccc-rack-models**: Core business logic and KOS data models
  - `RackModel`: Manages multi-screen layouts and content orchestration
  - `ScreenModel`: Individual screen content and playback control
  - `BundleModel`: Content grouping with scheduling and LED integration

- **model-components**: React components for rendering rack displays
  - `RackView`: Main container for multi-screen layout
  - `ScreenView`: Individual screen rendering (video/image)
  - `BundleView`: Bundle overlay management

## Prerequisites

Before getting started, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **npm** (v8 or higher)
3. **Java** (JDK 11 or higher) - Required for KOS platform integration
4. **KOS Studio** - Required for running the rack image (on Raspberry Pi or simulator)
5. **Android Studio** - Required for KOS device deployment and debugging
6. **KOS UI CLI** - Global CLI tool for KOS environment setup

## Getting Started

### 1. Start the Rack Image

The rack image must be running before starting development:

**Option A: Raspberry Pi**
- Deploy the rack image to a Raspberry Pi device through KOS Studio
- Ensure the device is connected to your network

**Option B: Simulator**
- Open KOS Studio
- Start the rack image in the simulator
- The simulator will run on your local machine

### 2. Install Dependencies

```bash
# Install project dependencies
npm install

# Install KOS UI CLI globally
npm install -g @kosdev-code/kos-ui-cli
```

### 3. Configure KOS Environment

Set up your local KOS environment variables using the KOS UI CLI:

```bash
kosui env -i
```

This command will:
- Create necessary KOS environment configuration files
- Set up KOS API endpoints and authentication
- Configure KOS device connection settings
- Initialize local development environment for KOS platform

### 4. Update CLI Tools (Optional)

Keep your KOS CLI tools up to date:

```bash
npm run update:cli
```

## Development

### Running the KOS Application

With the rack image running in KOS Studio (simulator or device):

```bash
# Start the development server
nx serve tccc-rack-ui
```

The KOS application will be available at `http://localhost:4200` and will connect to the running rack image.

### Building

```bash
# Build the application
nx build tccc-rack-ui

# Build all projects
npm run build
```

### Creating KAB Packages

To create a KAB (KOS Application Bundle) file for deployment to KOS devices:

```bash
npm run kab
```

This command will:
1. Build the KOS application in production mode
2. Create a KOS descriptor.json file
3. Package everything into a .kab file for KOS deployment
4. Output to `dist/archives/packages/tccc-rack-ui/`

### Other Useful Commands

```bash
# Update Nx plugin running in this workspace
npm run update:nx

# Update all KOS dependencies
npm run update:all

# Generate API types (for libraries)
nx api tccc-rack-models
nx api model-components
```

## KOS Platform Features

### KOS Model System

The application uses KOS's model system for state management:
- `@kosModel`: Decorator for defining KOS data models
- `@kosConfigProperty`: System configuration integration
- `@kosDependency`: Model dependency injection
- `@kosChild`: Child model containers


### Display Configuration

The rack system supports multiple display configurations:
- Single screen displays
- Multi-screen synchronized displays
- Extended displays spanning multiple screens

### Content Types

Supported content formats:
- **Video**: MP4, WebM
- **Images**: JPEG, PNG, GIF
- **Scheduling**: Time-based content rotation
- **Priority**: Content prioritization system

### LED Integration

The system includes LED control capabilities:
- Status indication
- Content synchronization
- Manufacturing mode indicators

## Project Configuration Files

- `nx.json`: Nx workspace configuration
- `package.json`: Dependencies and scripts
- `tsconfig.base.json`: TypeScript configuration
- `apps/tccc-rack-ui/project.json`: Application-specific Nx configuration
- `libs/*/project.json`: Library-specific Nx configurations
- `kos.json`: KOS application configuration

## Deployment

### Production Build

```bash
# Create production build
nx build tccc-rack-ui --configuration=production
```

### Creating KOS Deployment Package

```bash
# Create KAB file for KOS deployment
npm run kab
```

The KAB file will be created in `dist/archives/packages/tccc-rack-ui/tccc-rack-ui.kab`

### Deployment Steps

1. Ensure the rack image is running in KOS Studio
2. Build the application in production mode
3. Create the KAB package
4. Deploy to KOS devices using KOS Studio deployment tools
5. Configure device-specific settings through the KOS platform

## Environment Variables

Key environment variables configured by `kosui env -i`:
- KOS API endpoints
- KOS authentication credentials
- KOS device configuration
- Debug settings for KOS platform

## Troubleshooting

### Common Issues

1. **Cannot connect to rack image**
   - Ensure the rack image is running in KOS Studio
   - Verify network connectivity (for Pi) or simulator is started (for local)
   - Check that KOS environment variables are properly configured

2. **Missing KOS environment variables**
   - Run `kosui env -i` to reconfigure KOS environment

3. **Build failures**
   - Clear Nx cache: `nx reset`
   - Clean install: `rm -rf node_modules && npm install`

4. **KAB creation issues**
   - Ensure Java is properly installed (required for KOS tools)
   - Check that all build artifacts exist in dist/

5. **KOS Studio connection issues**
   - Restart KOS Studio
   - Check that Android Studio is properly configured
   - Verify device/simulator status in KOS Studio

## Nx Workspace

### Understanding the Graph

Visualize project dependencies:

```bash
nx graph
```

### Running Multiple Projects

```bash
# Run multiple targets
nx run-many -t build lint

# Filter specific projects
nx run-many -t build -p tccc-rack-models model-components
```

### Caching

Nx provides intelligent caching for build outputs. The cache is configured in `nx.json` and helps speed up subsequent builds.

## Contributing

### Development Workflow

1. Ensure rack image is running in KOS Studio
2. Create a feature branch
3. Make your changes
4. Run linting: `nx lint`
5. Build the project: `nx build`
6. Test KAB creation: `npm run kab`
7. Submit pull request

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode
- KOS coding standards


## Support

For issues and questions:
- Check the KOS platform documentation
- Review existing issues in the repository
- Contact the development team

---

Built on the KOS Platform using KOS UI SDK