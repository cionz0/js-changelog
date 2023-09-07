/**
 * @module src/type_definitions
 * @description Contains custom type definitions for js-changelog.
 * @createdOn 2023-09-07
 * @project js-changelog
 * @author cionzo
 */

"use strict";

/**
 * @typedef {object} SemVerInfo
 * @description Represents semantic versioning information.
 * @property {string} description - A short description or prefix for the version.
 * @property {number} major - The major version number.
 * @property {number} minor - The minor version number.
 * @property {number} patch - The patch version number.
 */

/**
 * @typedef {object} CommandLineArgs
 * @description Represents command-line arguments for js-changelog.
 * @property {string} [action] - The action to perform (optional).
 * @property {string} changelog_output - The path to the changelog file.
 * @property {string} changelog_template - The path to the changelog template file.
 * @property {string} package_json - The path to the package.json file.
 * @property {boolean} verbose - Indicates whether to enable verbose output.
 */

module.exports = {
    SemVerInfo: null,
    CommandLineArgs: null
};
