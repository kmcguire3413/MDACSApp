# MDACS App

Nightly: [![Nightly Build Status](https://travis-ci.org/kmcguire3413/MDACSApp.svg?branch=nightly)](https://travis-ci.org/kmcguire3413/MDACSApp)

Master: [![Master Build Status](https://travis-ci.org/kmcguire3413/MDACSApp.svg?branch=master)](https://travis-ci.org/kmcguire3413/MDACSApp)

This repository provides the application service. This service hosts web content that provides a graphical user interface for accessing the system.

See the MDACSTest project as a example of all needed core services integrated into a single package.

# Setup

The Babel CLI and plugin for JSX must be installed to build the project. Execute the following commands
inside the directory with the `README.md` file. The `jsxcompile.py` is a Python 3.x script that will 
execute the appropriate commands using the Babel CLI and the Babel plugin for JSX.

`npm install --save-dev babel-plugin-transform-react-jsx`
`npm install --save-dev babel-cli`

The GIT submodules for MDACSHTTPServer and MDACSAPI (at the time this documentation was written) must be
initialized. The following command executed in the base repository directory should perform that.

`git submodule init`
`git submodule update`

Then, check the directories to ensure they contain files and C# code. If they do then they are ready to be
used when building the project.

Navigate to the directory with the `README.md` for MDACSApp and execute:

`dotnet build`

Resolve any errors and retry until the build is successful. When successful the path 
`/MDACSApp/MDACSApp/bin` should be populated. A `MDACSApp.dll` should be created in
one of the child directories depending on the build settings.