/**
 * Module for executing command-line commands asynchronously.
 * @module src/cli_commands
 * @project js-changelog
 * @createdOn 07/09/23
 * @author cionzo <cionzoh@gmail.com>
 */

"use strict";

const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

/**
 * Execute a command and return its standard output.
 * @param {string} command - The command to execute.
 * @returns {Promise<string>} A promise that resolves to the standard output of the executed command.
 */
async function execute(command) {
    try {
        const execution = await exec(command);
        return execution.stdout;
    } catch (error) {
        // Handle any execution errors here
        throw new Error(`Failed to execute command: ${command}\nError: ${error.message}`);
    }
}

module.exports = { execute };
