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
 * @param {CommandLineArgs} args - Command line arguments.
 * @param {string} versionTagStr - The version tag for which the changelog is updated.
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
        // Check if the current branch is updated.
        await support.isBranchUpdated();

        // Compute the new release tag.
        const newTag = await support.computeNewReleaseTag(args);
        console.log(`New release tag is ${newTag}`);

        // Update the version in package.json.
        await updatePackageJsonVersion(newTag, args);
        // Stage the changes in package.json.
        await CLI_COMMANDS.execute(`git add ${args.package_json}`);
        // Commit the version bump.
        await CLI_COMMANDS.execute(`git commit -m "version bump: ${newTag}"`);

        // Update the changelog.
        await updateChangelog(args, newTag);
        // Stage the changelog changes.
        await CLI_COMMANDS.execute(`git add ${args.changelog_output}`);
        // Amend the commit to include changelog changes.
        await CLI_COMMANDS.execute("git commit --amend --no-edit");

        // Tag the current commit with the new release tag.
        await support.tagCurrentCommit(newTag);
        // Push the changes to the remote repository.
        await CLI_COMMANDS.execute("git push");




    } catch (error) {
        // Handle errors and throw an informative message.
        throw new Error(`Failed creating ${args.action.release} release: ${error.message}`);
    }
}



// MANUALE
// 0. parto da commit x, versione a.b.c (tutto pushato, nessun file modificato in locale)
// 1. modifica codice, fai cose
// 2. commit con messaggio "nuova funzionalità", commit y


// ho finito, faccio partire lo script:


// s1: controlliamo che non ci siano state altre modiriche da terzi controllando....

// # isBranchUpdated() check if the current branch is up-to-date to avoid creating an outdated release
// # check https://stackoverflow.com/a/17938274
//     def isBranchUpdated()
// sh("git fetch origin " + git_branch())
// currentLocalVer = sh("echo $(git rev-parse HEAD)")
// currentRemoteVer = sh("echo $(git rev-parse @{u})")
// UI.message("currentLocalVer sha1" + currentLocalVer)
// UI.message("currentRemoteVer sha1" + currentRemoteVer)
// return currentRemoteVer == currentLocalVer
// end

// s2a: se la funziona sopra non restituisce true --> fermati e chiedi di fare pull (a mano)
// s2b: ha restituito true, siamo felici perchè non ci sono state modifiche esterne, e continuiamo
// s3: calcola nuova release tag "T"
// s4: scrivila dentro package.json
// s5: committa modifiche a package.json -m "version bump"
// s6: aggiorna changelog e git add changelog
// s7: commit --amend --noedit // così include il changelog aggiornato
// s8: tagga commit corrente, versione "T"
// s9: push




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


    // await CLI_COMMANDS.execute(`git pull`);
    // await CLI_COMMANDS.execute("git commit --amend --no-edit");
    // await CLI_COMMANDS.execute("git push");
}



module.exports = {

    updateChangelog,
    createRelease,
    currentRelease: support.currentRelease
};

// Handle command-line execution
if (require.main === module) {

    const parser = parsing.getParser()
    const args = parser.parse_args();

    parsing.processArgs(args)

    // Call the appropriate function based on the selected action

    args.action ? module.exports[`${args.action.name}`](args) : parser.print_help();
}
