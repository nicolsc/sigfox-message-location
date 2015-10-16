#SIGFOX Admin — message localisation

##Description

Simple NodeJS application that uses the SIGFOX API to display recent messages from a given device.

It displays (_italic_ : data available only to Sigfox admins):

* Message time
* _Message sequence number_
* Raw payload
* List of stations having received this message, with the matching RSSI & _coordinates_
* _Map of the BTS that received the message_

##Install

* Install [NodeJS](http://nodejs.org/)
* Run `$ npm install`

##Access credentials

You need to provide your SIGFOX API credentials for this to work.

You can do this two different ways :


###Local file

**Use with caution**

First, create a `config.local.js` file

Then, put your credentials using this syntax :

```
module.exports = {
  DEBUG: 'message-localisation:*',
  SIGFOX_USERNAME: 'username',
  SIGFOX_PASSWORD: 'password'
};
```

###Environment variables

You need to manually set up these two env vars :

* `SIGFOX_USERNAME`
* `SIGFOX_PASSWORD`


##Run

```
$ npm start
```

Then open in your browser [http://localhost:34004](http://localhost:34004)
