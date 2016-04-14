## StitchQuery - "for getting all your stuff"™

StitchQuery allows you to query for more than 1000 objects by making multiple requests and stitching
the results together.

If you need more than 10,000 results (unlikely), you can use a SuperStitchQuery.

#### How does it work?

StitchQuery sets the maximum hosted Parse limit of 1000 on the provided query and makes an initial
request for the data. If 1000 objects are returned (the maximum batch size) we make additional
requests, taking care to increment the query's skip by the batch size of 1000 until we reach the
maximum skip (10k). This allows you to fetch up to 10,000 results using StitchQuery.

If desired, a SuperStitchQuery can be performed which will fetch unlimited results. It does this by
applying a sort on `createdAt` to the provided query and, upon reaching the maximum skip limit, gets
the date of the final item retrieved. To fetch the next batch it adds an additional query predicate
requesting only items that have `createdAt` greater than that of the last item returned and resets
the skip to zero. This process is repeated until all results are retrieved (receiving a batch with
less than the requested limit of 1000 documents).

 - Warning: SuperStitchQuery should **not** be used on queries that already have a sort applied!

#### Installation
```sh
npm install --save parse-stitch-query
```

#### Usage w/ Parse
```js
var Parse =  require('parse-shim');
var StitchQuery = require('parse-stitch-query');

var query = new Parse.Query(Model);
query.equalTo('blah', 'cool');

// Get up to 10,000 results with regular StitchQuery
StitchQuery(query).then((results) => {
  // all the results are here!
}, (error) => {
  // oh noes! errors
})

// SuperStitchQuery, for unlimited results!
StitchQuery(query, {superStitch: true}).then(...)

// Pass through query options 
StitchQuery(query, {userMasterKey: true}).then(...)
```
