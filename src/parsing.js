/**
 * This module defines functions for parsing command-line arguments.
 *
 * Created on: 07/09/23.
 * @module src/parsing
 * @project js-changelog
 * @author cionzo <cionzo@filotrack.com>
 */

"use strict";

const {ArgumentParser} = require("argparse");
const constants = require("./constants");

/**
 * Get a configured ArgumentParser instance.
 * @returns {ArgumentParser} An ArgumentParser instance configured with command-line argument definitions.
 */
function getParser() {
    const parser = new ArgumentParser({
        description: "Manages releases for this project.",
        add_help: true,
    });

    // Define actions for command-line arguments
    parser.add_argument("-c", "--current", {
        dest: "action",
        action: "store_const",
        const: "currentRelease",
        help: "returns the current release tag",
    });

    parser.add_argument("-M", "--major", {
        dest: "action",
        action: "store_const",
        const: {name: "createRelease", release: constants.RELEASE_TYPES.MAJOR},
        help: "creates a new major release",
    });
    parser.add_argument("-m", "--minor", {
        dest: "action",
        action: "store_const",
        const: {name: "createRelease", release: constants.RELEASE_TYPES.MINOR},
        help: "creates a new minor release",
    });
    parser.add_argument("-p", "--patch", {
        dest: "action",
        action: "store_const",
        const: {name: "createRelease", release: constants.RELEASE_TYPES.PATCH},
        help: "creates a new patch release",
    });


    parser.add_argument("-cl", "--changelog", {
        dest: "action",
        action: "store_const",
        const: {name: "updateChangelog"},
        help: "updates the changelog file",
    });

    // Define additional arguments
    parser.add_argument("-clo", "--changelog-output", {
        dest: "changelog_output",
        action: "store",
        default: constants.CHANGELOG_PATH,
        help: `the path to the changelog file (defaults to ${constants.CHANGELOG_PATH})`,
    });
    parser.add_argument("-clt", "--changelog-template", {
        dest: "changelog_template",
        action: "store",
        default: constants.CHANGELOG_TEMPLATE_PATH,
        help: "the path to a custom changelog template file",
    });
    parser.add_argument("-pj", "--package-json", {
        dest: "package_json",
        action: "store",
        default: constants.PACKAGE_JSON_PATH,
        help: `the path to the package.json file (defaults to ${constants.PACKAGE_JSON_PATH})`,
    });

    return parser;
}

/**
 * Process command-line arguments and modify them if needed.
 * @param {object} args - Parsed command-line arguments.
 * @returns {void} Nothing.
 */
function processArgs(args) {
    if (args.action === "currentRelease") {
        args.verbose = true; // Set verbose to true when --current is passed
    }
}

module.exports = {
    getParser,
    processArgs,
};
