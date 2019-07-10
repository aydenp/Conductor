# Conductor

Lightweight Node.js server to proxy HTTP connections to internal ports based on the requested host.

For testing reasons, you may want to expose your development machine to the outside internet or even use it on an internal network with predefined hostnames for multiple services. While it is possible to setup web server software such as Nginx or Apache, this carries a lot of configuration and can be tedious to do on a development machine. Conductor acts as a simple router: receiving these requests on one port, and forwarding it to another port on your machine based on the provided `Host` header, allowing you to more easily simulate your production environment.

It can also automatically port forward your machine on your router, if configured to do so (defaults to off). This is useful for quickly setting up external access that cleans itself up after, rather than manually setting up your router to do so.

## Reporting Issues

If you find a bug or code issue, report it on the [issues page](/issues).

## Contributing

Feel free to contribute to the source code of Conductor to make it something even better! Just try to adhere to the general coding style throughout, to make it as readable as possible.

## License

This project is licensed under the [MIT license](/LICENSE). Please make sure you comply with its terms while using it in any way.