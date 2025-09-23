# DEVELOP.md

This document provides guidelines for developing in the expo-secure-compressed-storage monorepo. It covers setup, workflows, and processes for building, testing, and publishing packages.

## Tooling

The monorepo utilizes several tools:

1. **pnpm** - Package management with workspace support
2. **Turborepo** - Monorepo task runner with caching
3. **tsup** - TypeScript build tool
4. **Jest** - Testing framework
5. **ESLint** - Linting
6. **Prettier** - Code formatting
7. **Changesets** - Version management and publishing

## Project Configuration

- **TypeScript**: Configuration in `tsconfig.json`
- **Turborepo**: Pipeline configuration in `turbo.json`
- **tsup**: Build configuration in `tsup.config.ts`
- **Jest**: Test configuration typically in each package's `jest.config.js`

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) - version 20 or higher
- [pnpm](https://pnpm.io/) - version 8.7.5 or higher
- [Git](https://git-scm.com/) (LOL, if you don't have this, we have bigger problems)

## Repository Structure

The repository is organized as a monorepo with the following structure:

```
expo-secure-compressed-storage-monorepo/
├── packages/                            # Core packages
│   ├── expo-secure-compressed-storage/  # Main package
├── examples/                   # Example applications TBD
```

## Setup

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd expo-secure-compressed-storage-monorepo
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Build all packages:
    ```bash
    pnpm build
    ```

## Development Workflow

### Running in Development Mode

The development mode watches for file changes and rebuilds automatically:

```bash
pnpm dev
```

To run development mode for a specific package (well, there's only _one_ right now :-D):

```bash
cd packages/expo-secure-compressed-storage
pnpm dev
```

### Building

Build all packages:

```bash
pnpm build
```

This uses [tsup](https://github.com/egoist/tsup) to build the TypeScript packages into CommonJS and ESM formats with declaration files.

### Testing

Run tests for all packages:

```bash
pnpm test
```

Run tests in watch mode for a specific package:

```bash
cd packages/expo-secure-compressed-storage
pnpm test:watch
```

### Linting

Lint all packages:

```bash
pnpm lint
```

### Formatting

Format all files with Prettier:

```bash
pnpm format
```

## Working with Examples

TBD

## Versioning and Publishing

The monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versions and publish packages.

### Creating a Changeset

When you make changes that need to be released:

1. Create a changeset:

    ```bash
    pnpm changeset
    ```

2. Follow the interactive prompts to:
    - Select the packages you've changed
    - Specify the type of change (major, minor, patch)
    - Provide a description of the changes

This creates a changeset file in the `.changeset` directory that will be used during the version and publish process. You don't commit the changeset file to the repo. You'd move on to the next step (version-packages).

### Versioning Packages

To update the versions of packages based on the changesets:

```bash
pnpm version-packages
```

This command:

- Reads all changesets
- Updates package versions accordingly
- Updates dependencies between packages
- Generates or updates CHANGELOG.md files

At this point you can commit to main if needed, however, changeset is also supposed to handle this for you in the release step.

### Publishing

To publish the packages to npm:

```bash
pnpm release
```

This will:

1. Build all packages
2. Publish the packages to npm
3. Push a release commit and tags to the repository

## Dependency Management

### Adding Dependencies to a Package

```bash
cd packages/expo-secure-compressed-storage
pnpm add <dependency-name>
```

### Adding Development Dependencies to a Package

```bash
cd packages/expo-secure-compressed-storage
pnpm add -D <dependency-name>
```

### Adding a Dependency to the Root

```bash
pnpm add -w <dependency-name>
```

### Managing Cross-Package Dependencies

For local dependencies between packages in the monorepo, use the `workspace:*` or `workspace:^` syntax:

```json
{
    "dependencies": {
        "@apogeelabs/expo-secure-compressed-storage": "workspace:*"
    }
}
```

## Troubleshooting

### Common Issues

1. **Dependency Issues**: If you encounter dependency issues, try cleaning the pnpm cache:

    ```bash
    pnpm store prune
    pnpm install
    ```

2. **Build Errors**: If you encounter build errors, try cleaning the build cache:

    ```bash
    pnpm turbo clean
    pnpm build
    ```

3. **Workspace Issues**: Ensure your pnpm version is compatible with the workspace setup:
    ```bash
    pnpm --version
    ```

## Additional Resources

- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Changesets Documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
