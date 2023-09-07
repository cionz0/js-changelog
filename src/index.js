#!/usr/bin/env node
/**
 * @module js-changelog
 * @description A command-line tool for managing Git tags and versioning.
 * @createdOn 2023-09-07
 * @project js-changelog
 * @author cionzo
 */

"use strict";

let VERBOSE_MODE = false;

const CLI_COMMANDS = require("./cli_commands");
const { ArgumentParser } = require('argparse');

/**
 * @typedef {Object} SemVerInfo
 * @property {string} description - The description part of the version tag.
 * @property {number} major - The major version number.
 * @property {number} minor - The minor version number.
 * @property {number} patch - The patch version number.
 */

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
 * Check if the 'git' command is available in the system.
 * @returns {Promise<boolean>} A promise that resolves to true if the 'git' command is available; otherwise, false.
 * @throws {Error} If the 'git' command is not available.
 * @private
 */
async function isGitCommandAvailable() {
    try {
        await CLI_COMMANDS.execute("git --version");
        return true;
    } catch (error) {
        throw new Error("Git command is unavailable. Please install Git or add it to your PATH.");
    }
}

/**
 * Tag the current commit with a given tag.
 * @param {string} tag - The tag to apply to the current commit.
 * @returns {Promise<void>} A promise that resolves when the commit is tagged successfully.
 * @throws {Error} If the provided tag does not match the SEMVER format.
 * @private
 */
async function tagCurrentCommit(tag) {
    if (!tag.match(SEMVER_TAG_PATTERN)) {
        throw new Error(`The provided tag (${tag}) does not conform to SEMVER format (${SEMVER_TAG_PATTERN}).`);
    }
    await CLI_COMMANDS.execute(`git tag ${tag}`);
}

/**
 * Get the SHA of the last tagged commit.
 * @returns {Promise<string|null>} A promise that resolves to the SHA of the last tagged commit or null if no tags exist.
 * @private
 */
async function getLastTaggedCommitSHA() {
    try {
        return await CLI_COMMANDS.execute("git rev-list --tags --max-count=1");
    } catch (error) {
        return null; // No tags exist
    }
}

/**
 * Get the associated tag for a given commit SHA.
 * @param {string} commitSHA - The commit SHA to find the associated tag.
 * @returns {Promise<string|null>} A promise that resolves to the associated tag or null if no tag is found.
 * @private
 */
async function getAssociatedTag(commitSHA) {
    try {
        return await CLI_COMMANDS.execute(`git describe --tags ${commitSHA}`);
    } catch (error) {
        return null; // No associated tag found
    }
}

/**
 * Parse a version tag into its components.
 * @param {string} versionTag - The version tag to parse.
 * @returns {object} An object with 'description', 'major', 'minor', and 'patch' properties as numbers.
 * @throws {Error} If the version tag cannot be parsed.
 * @private
 */
function parseVersionTag(versionTag) {
    const match = SEMVER_TAG_PATTERN.exec(versionTag);

    if (!match || !match.groups) {
        throw new Error(`Unable to parse version tag '${versionTag}'. It does not match the expected pattern.`);
    }

    const { description, major, minor, patch } = match.groups;

    return { description, major: Number(major), minor: Number(minor), patch: Number(patch) };
}

/**
 * Get the current release version or its components.
 * @param {boolean} [parsed=false] - If true, parse the version tag and return its components.
 * @returns {Promise<string|SemVerInfo>} A promise that resolves to the current release version as a string or an object
 *   with 'description', 'major', 'minor', and 'patch' properties if 'parsed' is true.
 * @throws {Error} If the 'git' command is not available or if 'parsed' is true and the version tag cannot be parsed.
 */
async function currentRelease(parsed = false) {
    if (!await isGitCommandAvailable()) {
        throw new Error("Git command is unavailable. Please install Git or add it to your PATH.");
    }

    const lastTaggedCommitSHA = await getLastTaggedCommitSHA();
    const currentReleaseStr = lastTaggedCommitSHA ? await getAssociatedTag(lastTaggedCommitSHA) : SEMVER_ZERO;

    if (parsed) {
        return parseVersionTag(currentReleaseStr);
    }

    if (VERBOSE_MODE) {
        console.log(`Current release is ${currentReleaseStr}`);
    }
    return currentReleaseStr;
}

/**
 * Compute a new release tag based on the current version and the specified release type.
 * @param {string} releaseType - The release type ("major", "minor", or "patch").
 * @returns {Promise<string>} A promise that resolves to the new release tag.
 * @throws {Error} If the current release cannot be parsed or if the release type is invalid.
 */
async function computeNewReleaseTag(releaseType) {
    let current = "\"undefined\"";
    try {
        current = await currentRelease(true);
        let newVersion;

        switch (releaseType) {
            case RELEASE_TYPES.MAJOR:
                newVersion = `${current.description}${current.major + 1}.0.0`;
                break;
            case RELEASE_TYPES.MINOR:
                newVersion = `${current.description}${current.major}.${current.minor + 1}.0`;
                break;
            case RELEASE_TYPES.PATCH:
                newVersion = `${current.description}${current.major}.${current.minor}.${current.patch + 1}`;
                break;
            default:
                throw new Error(`Invalid release type: "${releaseType}". It must be one of ${Object.keys(RELEASE_TYPES)}.`);
        }

        return newVersion;
    } catch (error) {
        throw new Error(`Unable to compute a new release tag starting from ${current}: ${error.message}`);
    }
}

/**
 * Update the changelog for a given version.
 * @param {string} version - The version for which the changelog is updated.
 * @param {string} [output_file] - The output file path for the changelog.
 * @param {string} [config_file_path] - The configuration file path for the changelog template.
 * @returns {Promise<void>} A promise that resolves when the changelog is updated.
 */
async function updateChangelog(version, output_file, config_file_path = "./node_modules/@cionzo/js-changelog/configs/changelog-template.hbs") {
    if (!version) {
        version = await currentRelease();
    }
    await CLI_COMMANDS.execute(`auto-changelog --unreleased --template ${config_file_path} ${output_file ? '--output ' + output_file : ''}`);
    console.log(`Changelog for version ${version} created.`);
}

/**
 * Create a new release, including tagging and updating the changelog.
 * @param {string} releaseType - The release type ("major", "minor", or "patch").
 * @throws {Error} If an error occurs during the release process.
 */
async function createRelease(releaseType) {
    try {
        const newTag = await computeNewReleaseTag(releaseType);
        await updatePackageJsonVersion(newTag);
        await tagCurrentCommit(newTag);
        await updateChangelog(newTag);
    } catch (error) {
        throw new Error(`Failed creating ${releaseType} release: ${error.message}`);
    }
}

/**
 * Perform a major release, including tagging and updating the changelog.
 * @throws {Error} If an error occurs during the release process.
 */
async function majorRelease() {
    await createRelease(RELEASE_TYPES.MAJOR);
}

/**
 * Perform a minor release, including tagging and updating the changelog.
 * @throws {Error} If an error occurs during the release process.
 */
async function minorRelease() {
    await createRelease(RELEASE_TYPES.MINOR);
}

/**
 * Perform a patch release, including tagging and updating the changelog.
 * @throws {Error} If an error occurs during the release process.
 */
async function patchRelease() {
    await createRelease(RELEASE_TYPES.PATCH);
}

/**
 * Update the version in package.json.
 * @param {string} newRel - The new release version.
 * @returns {Promise<void>} A promise that resolves when the package.json is updated.
 */
async function updatePackageJsonVersion(newRel) {
    const PACKAGE_JSON_FILENAME = "package.json";
    const fs = require("fs");
    const PACKAGE_JSON_DATA = JSON.parse(fs.readFileSync(PACKAGE_JSON_FILENAME).toString());
    PACKAGE_JSON_DATA.version = newRel.trim();
    fs.writeFileSync(PACKAGE_JSON_FILENAME, JSON.stringify(PACKAGE_JSON_DATA, undefined, 4));
    await CLI_COMMANDS.execute(`git add ${PACKAGE_JSON_FILENAME}`);
    await CLI_COMMANDS.execute(`git commit --amend`);
}

module.exports = {
    currentRelease,
    updateChangelog,
    majorRelease,
    minorRelease,
    patchRelease
};


if (require.main === module) {
    const parser = new ArgumentParser({
        description: 'Manages releases for this project.',
        add_help: true,
    });

    parser.add_argument('PROJECT_NAME', { help: 'The project name' });

    // Define actions for command-line arguments
    parser.add_argument('-c', '--current', {
        dest: 'action',
        action: 'store_const',
        const: 'currentRelease',
        help: 'returns the current release number',
    });
    parser.add_argument('-M', '--major', {
        dest: 'action',
        action: 'store_const',
        const: 'majorRelease',
        help: 'creates a new major release',
    });
    parser.add_argument('-m', '--minor', {
        dest: 'action',
        action: 'store_const',
        const: 'minorRelease',
        help: 'creates a new minor release',
    });
    parser.add_argument('-p', '--patch', {
        dest: 'action',
        action: 'store_const',
        const: 'patchRelease',
        help: 'creates a new patch release',
    });
    parser.add_argument('-cl', '--changelog', {
        dest: 'action',
        action: 'store_const',
        const: 'updateChangelog',
        help: 'updates the changelog file',
    });

    // Add a boolean flag for verbose, and set it to true when --current is present
    parser.add_argument('-v', '--verbose', {
        dest: 'verbose',
        action: 'store_true',
        default: false, // Default to false
        help: 'enable verbose output',
    });

    const args = parser.parse_args();

    if (args.action === 'currentRelease') {
        args.verbose = true; // Set verbose to true when --current is passed
    }

    VERBOSE_MODE = args.verbose

    args.action ? module.exports[args.action](args) : parser.print_help();
}
