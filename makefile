
# get current folder, as this file has to be placed in the project root
mkfile_path := $(abspath $(lastword $(MAKEFILE_LIST)))
PROJECT_NAME := $(notdir $(patsubst %/,%,$(dir $(mkfile_path))))


help_release:
	cd functions
	node ./configs/release_utils.js --help

major_rel:
	node ./configs/release_utils.js --major $(PROJECT_NAME)

minor_rel:
	node ./configs/release_utils.js --minor $(PROJECT_NAME)

fix_rel:
	node ./configs/release_utils.js --fix $(PROJECT_NAME)

changelog:
	node --experimental-repl-await  ./configs/release_utils.js -cl $(PROJECT_NAME)

current:
	node --experimental-repl-await ./configs/release_utils.js -c $(PROJECT_NAME)


