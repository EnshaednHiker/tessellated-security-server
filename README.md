# Tessellated Security
Tessellated Security is an end-to-end service to take your own tessel 2 and a magnetic switch and build your own security system. Check out the main [Github repo here](https://github.com/EnshaednHiker/tessellated-security) for a detailed tutorial on how to use the service. 

For the DYI security afficionado, all inclusive code to run a server (Node/Express), webclient, database (MongoDB/Mongoose), and a [tessel](https://tessel.io/) hooked up to a [magnetic door switch](https://www.sparkfun.com/products/13247).The project's server running here is hosted on Heroku while the database is on mLab.

This project containts three parts:

1. [Server](https://github.com/EnshaednHiker/tessellated-security-server)
2. [Website (repo)](https://github.com/EnshaednHiker/tessellated-security-webclient)/[Live site](https://enshaednhiker.github.io/tessellated-security-webclient/) 
3. [Command-line Package](https://github.com/EnshaednHiker/tessellated-security-command-line-package)

## Server
The server at this time is currently hosted on Heroku. I used CircleCI for continuous integration testing. [Github repo for the server API for the service.](https://github.com/EnshaednHiker/tessellated-security-server) The database for the data layer is hosted on mLab

## Video Tutorial and Demo of the the system in action

[![tutorial video](http://img.youtube.com/vi/RgxG61hzV68/0.jpg)](http://www.youtube.com/watch?v=RgxG61hzV68 "Tessellated Security Tutorial and Demo (updated website)")

1. 0:00-2:50 shows how to use the website
2. 2:51-3:40 shows how to assemble the tessel
3. 3:41-5:46 shows how to put the code onto the tessel with the command line commands via npm
4. 5:47-6:58 shows a basic demo of the device working

## License

[MIT](http://vjpr.mit-license.org)
