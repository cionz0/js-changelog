# @cionzo/js-changelog 1.2.2 

Semantic versioning and changelog generation utils

## Installation

This is a [Node.js](https://nodejs.org/) module available through the [github repository](https://www.github.com/).

It can be installed using the 
[`npm`](https://docs.npmjs.com/getting-started/installing-npm-packages-locally)
or 
[`yarn`](https://yarnpkg.com/en/)
command line tools.

```sh
npm install git+https://github.com/cionz0/js-changelog --save-dev
```

## Usage

You are assumed to have committed (but not yet pushed) your changes before using this tool.

Add the target `js-changelog` to the `scripts` section of your `package.json` file.

```javascript
{
    // ...
    "scripts": {
        // ...
        "js-changelog": "npx @cionzo/js-changelog"
    }
}
```

Remember that, in order to pass arguments to a node-invoked target, you should use `--`.
```sh
node js-changelog -- --help
```

## Tests

```sh
npm install
npm test
```

## Dependencies

- [argparse](https://ghub.io/argparse): CLI arguments parser. Native port of python&#39;s argparse.
- [auto-changelog](https://ghub.io/auto-changelog): Command line tool for generating a changelog from git tags and commit history
- [prompt-sync](https://ghub.io/prompt-sync): a synchronous prompt for node.js


## License

GPL-3.0
