# reddit-parser

## Description
Web application for parsing and representing JSON from reddit in CSV and SQL.

## Install

```
$ git clone https://github.com/maximzasorin/reddit-parser.git
$ cd reddit-parser
$ npm install
$ bower install
```

## Usage

Run it with:

```
$ node server.js
```

Navigate to:

```
http://localhost:3000/
```

## API

API support next urls:
* /api/v1/reddit/:r
* /api/v1/reddit/:r/top

...and next queries:
* format = csv | sql
* sort = id | title | created_utc | ...
* order = asc | desc
* delimiter = (any string) [CSV format only]
* table = (any string, ex.: articles) [SQL format only]
* columns = (any strings separated by comma, ex.: id,title,time,score) [SQL format only]

Request examples:
```
/api/v1/reddit/javascript?format=csv&sort=title&order=asc&delimiter=+,
/api/v1/reddit/javascript/top?format=csv&sort=score&order=desc
/api/v1/reddit/javascript/top?sort=domain
```

## Also

It was test task when I was looking for a job and my first application with Node.js, Express, MongoDB and AngularJS.


