/**
 * This module ...
 *
 * <!-- do not type below this line -->
 * Created on: 07/09/23.
 * @module src/support
 * @project js-changelog
 * @author cionzo <cionzo@filotrack.com>
 */
"use strict"

const CLI_COMMANDS = require("./cli_commands");
const constants = require("./constants")
const {SemVerInfo, CommandLineArgs} = require("./type_definitions")



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
 * Parse a version tag into its components.
 * @param {string} versionTag - The version tag to parse.
 * @returns {object} An object with 'description', 'major', 'minor', and 'patch' properties as numbers.
 * @throws {Error} If the version tag cannot be parsed.
 * @private
 */
function parseVersionTag(versionTag) {
    const match = constants.SEMVER_TAG_PATTERN.exec(versionTag);

    if (!match || !match.groups) {
        throw new Error(`Unable to parse version tag '${versionTag}'. It does not match the expected pattern.`);
    }

    const {description, major, minor, patch} = match.groups;

    return {description, major: Number(major), minor: Number(minor), patch: Number(patch)};
}

/**
 * Tag the current commit with a given tag.
 * @param {string} tag - The tag to apply to the current commit.
 * @returns {Promise<void>} A promise that resolves when the commit is tagged successfully.
 * @throws {Error} If the provided tag does not match the SEMVER format.
 * @private
 */
async function tagCurrentCommit(tag) {
    if (!tag.match(constants.SEMVER_TAG_PATTERN)) {
        throw new Error(`The provided tag (${tag}) does not conform to SEMVER format (${constants.SEMVER_TAG_PATTERN}).`);
    }
    await CLI_COMMANDS.execute(`git tag ${tag}`);
}



/**
 * Get the current release version or its components.
 * @param {CommandLineArgs} args - Command line arguments.
 * @param {boolean} [parsed] - If true, parse the version tag and return its components.
 * @returns {Promise<string|SemVerInfo>} A promise that resolves to the current release version as a string or an object
 * with 'description', 'major', 'minor', and 'patch' properties if 'parsed' is true.
 * @throws {Error} If the 'git' command is not available or if 'parsed' is true and the version tag cannot be parsed.
 */
async function currentRelease(args,parsed = false) {
    if (!await isGitCommandAvailable()) {
        throw new Error("Git command is unavailable. Please install Git or add it to your PATH.");
    }

    const lastTaggedCommitSHA = await getLastTaggedCommitSHA();
    const currentReleaseStr = lastTaggedCommitSHA ? await getAssociatedTag(lastTaggedCommitSHA) : constants.SEMVER_ZERO;

    if (parsed) {
        return parseVersionTag(currentReleaseStr);
    }

    if (args.verbose) {
        console.log(`Current release is ${currentReleaseStr}`);
    }
    return currentReleaseStr;
}

/**
 * Compute a new release tag based on the current version and the specified release type.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<string>} A promise that resolves to the new release tag.
 * @throws {Error} If the current release cannot be parsed or if the release type is invalid.
 */
async function computeNewReleaseTag(args) {
    let current = "\"undefined\"";
    try {
        current = await currentRelease(args,true);
        let newVersion;

        switch (args.action.release) {
            case constants.RELEASE_TYPES.MAJOR:
                newVersion = `${current.description}${current.major + 1}.0.0`;
                break;
            case constants.RELEASE_TYPES.MINOR:
                newVersion = `${current.description}${current.major}.${current.minor + 1}.0`;
                break;
            case constants.RELEASE_TYPES.PATCH:
                newVersion = `${current.description}${current.major}.${current.minor}.${current.patch + 1}`;
                break;
            default:
                throw new Error(`Invalid release type: "${args.action.release}". It must be one of ${Object.keys(constants.RELEASE_TYPES)}.`);
        }

        return newVersion;
    } catch (error) {
        throw new Error(`Unable to compute a new release tag starting from ${current}.\n Args: ${args}.\nError: ${error.message}`);
    }
}

module.exports = {
    isGitCommandAvailable,
    getAssociatedTag,
    getLastTaggedCommitSHA,
    parseVersionTag,
    tagCurrentCommit,
    currentRelease,
    computeNewReleaseTag

}