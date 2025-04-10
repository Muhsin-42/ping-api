To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:3000

PROJECT:
PingMe
Backend: Hono Bun Typescript
MVC Architecture

project description :
Pingme is an website where user can signup and add their urls to be pinged in an interval. inorder to keep their server up and running on free tier platforms like render and railway.app. user can add multiple urls and set interval for each url.
and user can also schedule which all day they want to ping suppose they only want to ping on mon,tue,wed,thu,fri but not on sat and sun. and also he can choose from at what time to what time one can ping maybe 9:00 am to 11:00 pm. this scheduling is to prevent the server from being pinged during the day when the user is not using the website.

features: - User Authentication - Add URLs to be pinged - url, interval (min 5 min), days of week, time range. - View all pinged URLs - Delete URLs - View logs of pinging -
