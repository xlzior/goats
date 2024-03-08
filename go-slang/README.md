# go-slang

A small JavaScript-based tool designed to execute Go programs

## Getting Started

### Installation

1. Install dependencies on your local machine:

```
yarn install
```

### Usage

To run tests:
```
yarn test
```

To build:

```
yarn build
```
The built JavaScript files are located at the `dist` directory.

## Using your go-slang in your local js-slang

First, build and link your local go-slang:

```bash
$ cd go-slang
$ yarn build
$ yarn link
```

Then, from your local copy of js-slang:

```bash
$ cd js-slang
$ yarn link go-slang
```

To view all Yarn links created on your machine, navigate to the following directory on macOS terminal:
```bash
cd ~/.config/yarn/link
ls
```