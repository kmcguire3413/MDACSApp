# MDACS App

This is the web-based user interface component of the system. It privides a graphical user interface. There
are other components required for a fully functional system.

# Other Major Components

The other major components are MDACSDatabase, MDACSStorageJuggler and MDACSAuth, which reside 
in separate repositories. These three components or anything exposing the same interface are 
required for a fully functioning system.

At least one additional component is likely desired. This is generally what will be a source of
data. For example, if one is building a secure data storage system then this final component may
acquire data from devices and push that data securly to the database component.

Overall, the database service aids in the secure storage and access control of data. The authentication
services provides authentication for users using the database. A data source type component provides
the data into the system. The storage juggler service handles removal of deleted data. And, finally, 
the web application provides a graphical user interface.

# Use-Case Scenarios

* The organized storage of various data for which specific time to live and storage options are needed.
* Body camera video, audio, and picture storage system with secure chain of custody.
* Data acquired from various sources, accessed by various people, where access controls provided some with the ability to delete or view data.
* Any situation that requires progamatic access (through the HTTP/S REST API) for any previous use cases.

At this time, some of these use-case scenarios might desire or require additional features; however, each also
likely requires a component to source the data. The manual upload of data is possible (pending feature) and that
may fit the use-case but for a majority of cases the data is likely to be acquired in an automated manner.

# Current Features

* Stack sequences of MP4 videos that happen within a short time of each other. This is useful for cameras that do not produce a single large video.
* Search data by date, time, user, device, or note.
* Add individual users with specific permissions.
* Limit users to viewing certain data and being unable to delete data.
* Set notes on data which can be searchable.
* Tag data with intentions that are automatically performed such as delete and auto-purge after X days.
* Upload data into the cloud on delete or purge. [storage juggler service]

# Future Features

* Manual upload of data from the web interface.
* Rich custom meta-data support for data items.
* Support for custom data tags for custom components and services.
* Text or email support for notifications.
* Timestamp authority support for proof of data existance at a specific time and non-repudiation.

# Building

The command `dotnet build` will build the project.

# Running

The command `dotnet MDACSApp.dll <path/to/configuration-file.json>` will execute the service.

# Configuration

An example of the configuration for this service is provided below:
```
{
	"auth_url": "https://someserver.net:34002",
	"db_url": "https://someserver.net:34001",
	"port": 443,
	"web_resources_path": "/path/to/webres/directory",
	"ssl_cert_path": "certificate.pfx",
	"ssl_cert_pass": "certificate-private-key-password"
}
```

As can be seen, this service points to the other two services: database and auth (authentication).