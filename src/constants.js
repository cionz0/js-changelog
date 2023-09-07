/**
 * This module ...
 *
 * <!-- do not type below this line -->
 * Created on: 07/09/23.
 * @module src/defaults
 * @project js-changelog
 * @author cionzo <cionzo@filotrack.com>
 */
"use strict"

/**
 * An object representing release types for version incrementation.
 * @constant {object}
 * @property {string} MAJOR - Represents a major version increment.
 * @property {string} MINOR - Represents a minor version increment.
 * @property {string} PATCH - Represents a patch version increment.
 */
const RELEASE_TYPES = {
    MAJOR: "major",
    MINOR: "minor",
    PATCH: "patch"
};


/**
 * Regular expression pattern for parsing SEMVER tags.
 * @type {RegExp}
 */
const SEMVER_TAG_PATTERN = /(?<description>[a-zA-Z]*)(?<major>\d+)\.(?<minor>\d+).(?<patch>\d+)\s*/g;

/**
 * Default SEMVER version when no tags are available.
 * @type {string}
 */
const SEMVER_ZERO = "0.0.0";

module.exports = {
    CHANGELOG_PATH: "./CHANGELOG.md",
    CHANGELOG_TEMPLATE_PATH: "./node_modules/@cionzo/js-changelog/configs/changelog-template.hbs",
    PACKAGE_JSON_PATH: "./package.json",
    RELEASE_TYPES,
    SEMVER_ZERO,
    SEMVER_TAG_PATTERN
}
 