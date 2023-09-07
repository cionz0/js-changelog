#!/usr/bin/env node
/**
 * This module is a helper for managing releases
 *
 * <!-- do not type below this line -->
 * Created on: 24/11/21
 * @module configs/release_utils
 * @author cionzo <cionzo@filotrack.com>
 */
"use strict"

module.exports = {
  major_release,
  minor_release,
  fix_release,
  current_release,
  _update_changelog,
}

const {ArgumentParser} = require('argparse')
const {promisify} = require('util')
const exec = promisify(require('child_process').exec)
const path = require('path')

let parser = new ArgumentParser({
  description: 'Manages releases for this project.',
  add_help: true,
})

parser.add_argument('PROJECT_NAME', {help: 'The project name'})
//
parser.add_argument('-v', '--verbose', {action: 'store_true'})
parser.add_argument('-c', '--current', {
  dest: 'action',
  action: 'store_const',
  const: 'current_release',
  help: 'returns the current release number',
})
parser.add_argument('-M', '--major', {
  dest: 'action',
  action: 'store_const',
  const: 'major_release',
  help: 'creates a new major release',
})
parser.add_argument('-m', '--minor', {
  dest: 'action',
  action: 'store_const',
  const: 'minor_release',
  help: 'creates a new minor release',
})
parser.add_argument('-f', '--fix', {
  dest: 'action',
  action: 'store_const',
  const: 'fix_release',
  help: 'creates a new fix release',
})

parser.add_argument('-cl', '--changelog', {
  dest: 'action',
  action: 'store_const',
  const: '_update_changelog',
  help: 'updates the changelog file',
})

const args = parser.parse_args()

function _print_verbose(_string) {
  if (args.verbose) console.log(_string)
}

async function _run_shell_command(command) {
  const execution = await exec(command)
  return execution.stdout
}

async function current_release() {
  const command = 'git describe --tags $(git rev-list --tags --max-count=1)' //'git describe --tags --abbrev=0'
  const output = await _run_shell_command(command)

  // const delme = re.compile(r'''(?P<description>[a-zA-Z]*)(?P<major>[0-9]+).(?P<minor>[0-9]+).(?P<fix>[0-9]+)''',re.VERBOSE)
  const pattern = /([a-zA-Z]*)(\d+)\.(\d+).(\d+)\s*/g
  let match = pattern.exec(output)
  let description = '',
    major = '',
    minor = '',
    fix = ''
  console.log(output)
  description = match[1]
  major = parseInt(match[2])
  minor = parseInt(match[3])
  fix = parseInt(match[4])

  _print_verbose(`Current release is: ${description}${major}.${minor}.${fix}`)
  return {description, major, minor, fix}
}

async function major_release() {
  let {description, major, minor, fix} = await current_release()
  major += 1
  minor = 0
  fix = 0
  let release_tag = `${description}${major}.${minor}.${fix}`
  await _run_shell_command(`git tag ${release_tag}`)
  _print_verbose(`New release is: ${release_tag}`)
  await _update_changelog()
}

async function minor_release() {
  let {description, major, minor, fix} = await current_release()
  minor += 1
  fix = 0
  let release_tag = `${description}${major}.${minor}.${fix}`
  await _run_shell_command(`git tag ${release_tag}`)
  _print_verbose(`New release is: ${release_tag}`)
  await _update_changelog()
}

async function fix_release() {
  let {description, major, minor, fix} = await current_release()
  fix += 1
  let release_tag = `${description}${major}.${minor}.${fix}`
  await _run_shell_command(`git tag ${release_tag}`)
  _print_verbose(`New release is: ${release_tag}`)
  await _update_changelog()
}

async function _update_changelog() {
  // const pwd = process.cwd()
  const project_root = _get_project_root()
  const functions_dir = `${project_root}${path.sep}functions`
  process.chdir(functions_dir)
  await _run_shell_command(`npm run changelog`)
}

function _get_project_root() {
  const cwd = process.cwd()
  return cwd.slice(0, args.PROJECT_NAME.length + cwd.indexOf(args.PROJECT_NAME))
}

//
// ''
// ' Finally, execute the desired command '
// ''
// if args.action is
// not
// None:
//   locals()[args.action]()
// else:
// parser.print_help()
//

if (args.action != null) {
  console.log(args.action)
  const f = module.exports[args.action]
  f()
  // module.exports[args.action]()
  // Reflect.apply(args.action, null, null)
} else {
  parser.print_help()
}
