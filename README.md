# MDACS App

This is the central component of the entire system. It provides a lightweight HTTP/S server 
for the web interface front-end. It is not a required component but instead an optional one
that simplys presents the user interface over the HTTP/S protocol.

# Other Components

The other components are MDACSDatabase and MDACSAuth. These two components are required and
depend on each other. The application hosted by this application service connects to these
two components.

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