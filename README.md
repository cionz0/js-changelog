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

### Configuration
Add the target `js-changelog` to the `scripts` section of your `package.json` file.

```JSON
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
### Example 

In order to correctly use this tool, your changes must be already committed and pushed.
Your local and remote repositories are hence assumed to refer to the same commit.

At this point, you can run something like the following command.
```sh
node js-changelog -- --minor
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
