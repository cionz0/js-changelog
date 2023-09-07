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
const {CommandLineArgs} = require("./type_definitions")
const support = require("./support")
const parsing = require("./parsing")
// const constants = require("./constants");



//
//
// /**
//  * Perform a major release, including tagging and updating the changelog.
//  * @param {CommandLineArgs} args - Command line arguments.
//  * @returns {Promise<void>} A Promise that resolves when the major release process is completed successfully.
//  * @throws {Error} If an error occurs during the release process.
//  */
// async function majorRelease(args) {
//     await createRelease(RELEASE_TYPES.MAJOR, args);
// }
//
// /**
//  * Perform a minor release, including tagging and updating the changelog.
//  * @param {CommandLineArgs} args - Command line arguments.
//  * @returns {Promise<void>} A Promise that resolves when the minor release process is completed successfully.
//  * @throws {Error} If an error occurs during the release process.
//  */
// async function minorRelease(args) {
//     await createRelease(RELEASE_TYPES.MINOR, args);
// }
//
// /**
//  * Perform a patch release, including tagging and updating the changelog.
//  * @param {CommandLineArgs} args - Command line arguments.
//  * @returns {Promise<void>} A Promise that resolves when the patch release process is completed successfully.
//  * @throws {Error} If an error occurs during the release process.
//  */
// async function patchRelease(args) {
//     await createRelease(RELEASE_TYPES.PATCH, args);
// }








/**
 * Update the changelog for a given version.
 * @param {string} versionTagStr - The version tag for which the changelog is updated.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A promise that resolves when the changelog is updated.
 */
async function updateChangelog(args, versionTagStr) {
    if (!versionTagStr) {
        versionTagStr = await support.currentRelease(args);
    }
    versionTagStr = versionTagStr.trim()
    await CLI_COMMANDS.execute(`auto-changelog --unreleased --template ${args.changelog_template} --output ${args.changelog_output}`);
    console.log(`Changelog for version ${versionTagStr} created.`);
}

/**
 * Create a new release, including tagging and updating the changelog.
 * @param {CommandLineArgs} args - Command line arguments.
 * @returns {Promise<void>} A Promise that resolves when the release creation process is completed successfully.
 * @throws {Error} If an error occurs during the release process.
 */
async function createRelease(args) {
    try {
        const newTag = await support.computeNewReleaseTag(args);
        await updatePackageJsonVersion(newTag, args);
        await support.tagCurrentCommit(newTag);
        await updateChangelog(args, newTag);
    } catch (error) {
        throw new Error(`Failed creating ${args.action.release} release: ${error.message}`);
    }
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

    updateChangelog,
    createRelease
};

// Handle command-line execution
if (require.main === module) {

    const parser = parsing.getParser()
    const args = parser.parse_args();

    parsing.processArgs(args)

    // Call the appropriate function based on the selected action

    args.action ? module.exports[`${args.action.name}`](args) : parser.print_help();
}
