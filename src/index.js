/**
 * @module src/index
 * @description A module for managing Git tags and versioning.
 * @createdOn 2023-09-07
 * @project js-changelog
 * @author cionzo <cionzoh@gmail.com>
 */

"use strict";


const CLI_COMMANDS = require("./cli_commands");
const {ArgumentParser} = require('argparse')
const auto_changelog = require("auto-changelog")
/**
 * @typedef {Object} SemVerInfo
 * @property {string} description - The description part of the version tag.
 * @property {number} major - The major version number.
 * @property {number} minor - The minor version number.
 * @property {number} patch - The patch version number.
 */


/**
 * The regular expression pattern for parsing SEMVER tags.
 * @type {RegExp}
 */
const SEMVER_TAG_PATTERN = /(?<description>[a-zA-Z]*)(?<major>\d+)\.(?<minor>\d+).(?<patch>\d+)\s*/g;

/**
 * The default SEMVER version when no tags are available.
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
        throw new Error(`The provided tag (${tag}) does not respect SEMVER format (${SEMVER_TAG_PATTERN}).`);
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
        throw new Error(`Cannot parse version tag '${versionTag}'. It does not match the expected pattern.`);
    }

    const {description, major, minor, patch} = match.groups;

    return {description, major: Number(major), minor: Number(minor), patch: Number(patch)};
}

/**
 * Get the current release version or its components.
 * @param {boolean} [parsed=false] - If true, parse the version tag and return its components.
 * @returns {Promise<string|SemVerInfo>} A promise that resolves to the current release version as a string, or an object
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

    return currentReleaseStr;
}

/**
 * Compute a new release tag based on the current version and the specified release type.
 *
 * @param {string} releaseType - The release type ("major", "minor", or "patch").
 * @returns {Promise<string>} A promise that resolves to the new release tag.
 * @throws {Error} If the current release cannot be parsed or if the release type is invalid.
 */
async function computeNewReleaseTag(releaseType) {
    try {
        const current = await currentRelease(true);
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
                throw new Error(`Invalid release type: "${releaseType}". It must be one of ${JSON.stringify(Object.keys(RELEASE_TYPES))}.`);
        }

        return newVersion;
    } catch (error) {
        throw new Error(`Unable to compute a new release tag: ${error.message}`);
    }
}

/**
 * Update the changelog for a given version.
 * @param {string} version - The version for which the changelog is updated.
 * @returns {Promise<void>} A promise that resolves when the changelog is updated.
 */
async function updateChangelog(version, output_file, config_file_path="./configs/changelog-template.hbs") {
    auto_changelog.await
    CLI_COMMANDS.execute(`auto-changelog --unreleased --config ${config_file_path} --output ${output_file}`);
    console.log(`Changelog for version ${version} created.`);
}

/**
 * Perform a major release, including tagging and updating the changelog.
 * @throws {Error} If an error occurs during the release process.
 */
async function majorRelease() {
    try {
        const newRel = await computeNewReleaseTag(RELEASE_TYPES.MAJOR);
        await tagCurrentCommit(newRel);
        await updateChangelog(newRel);
    } catch (error) {
        throw new Error(`Major release failed: ${error.message}`);
    }
}

/**
 * Perform a minor release, including tagging and updating the changelog.
 * @throws {Error} If an error occurs during the release process.
 */
async function minorRelease() {
    try {
        const newRel = await computeNewReleaseTag(RELEASE_TYPES.MINOR);
        await tagCurrentCommit(newRel);
        await updateChangelog(newRel);
    } catch (error) {
        throw new Error(`Minor release failed: ${error.message}`);
    }
}

/**
 * Perform a patch release, including tagging and updating the changelog.
 * @throws {Error} If an error occurs during the release process.
 */
async function patchRelease() {
    try {
        const newRel = await computeNewReleaseTag(RELEASE_TYPES.PATCH);
        await tagCurrentCommit(newRel);
        await updateChangelog(newRel);
    } catch (error) {
        throw new Error(`Patch release failed: ${error.message}`);
    }
}

module.exports = {currentRelease, updateChangelog, majorRelease, minorRelease, patchRelease};


if (require.main === module) {

    let parser = new ArgumentParser({
        description: 'Manages releases for this project.',
        add_help: true,
    })

    parser.add_argument('PROJECT_NAME', {help: 'The project name'})
        .add_argument('-v', '--verbose', {action: 'store_true'})
        .add_argument('-c', '--current', {
            dest: 'action',
            action: 'store_const',
            const: 'currentRelease',
            help: 'returns the current release number',
        })
        .add_argument('-M', '--major', {
            dest: 'action',
            action: 'store_const',
            const: 'majorRelease',
            help: 'creates a new major release',
        })
        .add_argument('-m', '--minor', {
            dest: 'action',
            action: 'store_const',
            const: 'minorRelease',
            help: 'creates a new minor release',
        })
        .add_argument('-p', '--patch', {
            dest: 'action',
            action: 'store_const',
            const: 'patchRelease',
            help: 'creates a new patch release',
        })

        .add_argument('-cl', '--changelog', {
            dest: 'action',
            action: 'store_const',
            const: 'updateChangelog',
            help: 'updates the changelog file',
        })

    const args = parser.parse_args()
    console.log("ciao")
}