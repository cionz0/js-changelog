/**
 * This module ...
 *
 * <!-- do not type below this line -->
 * Created on: 07/09/23
 * @project js-changelog
 * @module src/cli_commands
 * @author cionzo <cionzo@filotrack.com>
 */
"use strict"

const {promisify} = require('util')
const exec = promisify(require('child_process').exec)
// require('child_process').execSync()

async function execute(command) {
 const execution = await exec(command)
 return execution.stdout
}

module.exports = {execute}
 