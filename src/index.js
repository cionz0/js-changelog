#!/usr/bin/env node
/**
 * @module js-changelog
 * @description A command-line tool for managing Git tags and versioning.
 * @createdOn 2023-09-07
 * @project js-changelog
 * @author cionzo
 */

"use strict";

// Import required modules
const CLI_COMMANDS = require("./cli_commands");
const {ArgumentParser} = require("argparse");
const {SemVerInfo, CommandLineArgs} = require("./type_definitions")


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

    const {description, major, minor, patch} = match.groups;

    return {description, major: Number(major), minor: Number(minor), patch: Number(patch)};
}

/**
 * Get the current release version or its components.
 * @param {boolean} [parsed] - If true, parse the version tag and return its components.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<string|SemVerInfo>} A promise that resolves to the current release version as a string or an object
 * with 'description', 'major', 'minor', and 'patch' properties if 'parsed' is true.
 * @throws {Error} If the 'git' command is not available or if 'parsed' is true and the version tag cannot be parsed.
 */
async function currentRelease(parsed = false, args) {
    if (!await isGitCommandAvailable()) {
        throw new Error("Git command is unavailable. Please install Git or add it to your PATH.");
    }

    const lastTaggedCommitSHA = await getLastTaggedCommitSHA();
    const currentReleaseStr = lastTaggedCommitSHA ? await getAssociatedTag(lastTaggedCommitSHA) : SEMVER_ZERO;

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
 * @param {string} releaseType - The release type ("major", "minor", or "patch").
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<string>} A promise that resolves to the new release tag.
 * @throws {Error} If the current release cannot be parsed or if the release type is invalid.
 */
async function computeNewReleaseTag(releaseType, args) {
    let current = "\"undefined\"";
    try {
        current = await currentRelease(true, args);
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
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A promise that resolves when the changelog is updated.
 */
async function updateChangelog(version, args) {
    if (!version) {
        version = await currentRelease(args);
    }
    await CLI_COMMANDS.execute(`auto-changelog --unreleased --template ${args.changelog_template} --output ${args.changelog_output}`);
    console.log(`Changelog for version ${version} created.`);
}

/**
 * Create a new release, including tagging and updating the changelog.
 * @param {string} releaseType - The release type ("major", "minor", or "patch").
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A Promise that resolves when the release creation process is completed successfully.
 * @throws {Error} If an error occurs during the release process.
 */
async function createRelease(releaseType, args) {
    try {
        const newTag = await computeNewReleaseTag(releaseType, args);
        await updatePackageJsonVersion(newTag, args);
        await tagCurrentCommit(newTag);
        await updateChangelog(newTag, args);
    } catch (error) {
        throw new Error(`Failed creating ${releaseType} release: ${error.message}`);
    }
}

/**
 * Perform a major release, including tagging and updating the changelog.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A Promise that resolves when the major release process is completed successfully.
 * @throws {Error} If an error occurs during the release process.
 */
async function majorRelease(args) {
    await createRelease(RELEASE_TYPES.MAJOR, args);
}

/**
 * Perform a minor release, including tagging and updating the changelog.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A Promise that resolves when the minor release process is completed successfully.
 * @throws {Error} If an error occurs during the release process.
 */
async function minorRelease(args) {
    await createRelease(RELEASE_TYPES.MINOR, args);
}

/**
 * Perform a patch release, including tagging and updating the changelog.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A Promise that resolves when the patch release process is completed successfully.
 * @throws {Error} If an error occurs during the release process.
 */
async function patchRelease(args) {
    await createRelease(RELEASE_TYPES.PATCH, args);
}

/**
 * Update the version in package.json.
 * @param {string} newRel - The new release version.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A promise that resolves when the package.json is updated.
 */
async function updatePackageJsonVersion(newRel, args) {
    const fs = require("fs");
    const PACKAGE_JSON_DATA = JSON.parse(fs.readFileSync(args.package_json).toString());
    PACKAGE_JSON_DATA.version = newRel.trim();
    fs.writeFileSync(args.package_json, JSON.stringify(PACKAGE_JSON_DATA, undefined, 4));
    await CLI_COMMANDS.execute(`git add ${args.package_json}`);
    await CLI_COMMANDS.execute("git commit --amend --no-edit");
}

module.exports = {
    currentRelease,
    updateChangelog,
    majorRelease,
    minorRelease,
    patchRelease
};

// Handle command-line execution
if (require.main === module) {
    const parser = new ArgumentParser({
        description: "Manages releases for this project.",
        add_help: true,
    });

    // Define actions for command-line arguments
    parser.add_argument("-c", "--current", {
        dest: "action",
        action: "store_const",
        const: "currentRelease",
        help: "returns the current release number",
    });
    parser.add_argument("-M", "--major", {
        dest: "action",
        action: "store_const",
        const: "majorRelease",
        help: "creates a new major release",
    });
    parser.add_argument("-m", "--minor", {
        dest: "action",
        action: "store_const",
        const: "minorRelease",
        help: "creates a new minor release",
    });
    parser.add_argument("-p", "--patch", {
        dest: "action",
        action: "store_const",
        const: "patchRelease",
        help: "creates a new patch release",
    });
    parser.add_argument("-cl", "--changelog", {
        dest: "action",
        action: "store_const",
        const: "updateChangelog",
        help: "updates the changelog file",
    });

    // Define additional arguments
    parser.add_argument("-clo", "--changelog-output", {
        dest: "changelog_output",
        action: "store",
        default: "./CHANGELOG.md",
        help: "the path to the changelog file",
    });
    parser.add_argument("-clt", "--changelog-template", {
        dest: "changelog_template",
        action: "store",
        default: "./node_modules/@cionzo/js-changelog/configs/changelog-template.hbs",
        help: "the path to the changelog template file",
    });
    parser.add_argument("-pj", "--package-json", {
        dest: "package_json",
        action: "store",
        default: "./package.json",
        help: "the path to the package.json file",
    });
    // Add a boolean flag for verbose, and set it to true when --current is present
    parser.add_argument("-v", "--verbose", {
        dest: "verbose",
        action: "store",
        default: false, // Default to false
        help: "enable verbose output",
    });

    const args = parser.parse_args();

    if (args.action === "currentRelease") {
        args.verbose = true; // Set verbose to true when --current is passed
    }

    // Call the appropriate function based on the selected action
    args.action ? module.exports[args.action](args) : parser.print_help();
}
