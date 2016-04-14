var Parse = require('parse-shim');

var PAGE_SIZE = 1000;
var MAX_QUERIES = 10;

//
// Run the specified parse query multiple times, modifying skip/limit each
// time to download all available objects. Return a promise with the stitched
// results from all individual queries. This works around the limit of 1000
// results per parse query.
//
// For safety, unless superStitch is specified, this limits the total number
// of queries to 10, yielding an effective max of 10,000 results.
//
// If the 'superStitch' option is specified, results are ordered and additionally paged
// by the 'createdAt' date field after exhausting the 10k skip. This effectively
// allows a query to yield unlimited results.
//
// @param query {Parse.Query} The query to stitch.
// @param options {Object} StitchQuery options below, all others passed to query as query opts.
//   - superStitch {Boolean} If you want more than 10k rows you can superStitch.
//
// NOTE: superStitch is not suitable for use with a sort (as it applies its own sort on createdAt)
// NOTE: This will modify the specified query, do not reuse the query after calling this function.
//
function StitchQuery(query, options) {
  options = options || {};

  query.limit(PAGE_SIZE);

  if (options.superStitch) {
    query.ascending('createdAt');
  }

  var stitchedPromise = new Parse.Promise();
  var stitchedResults = [];

  function getNextPage(curPage, startDate) {
    query.skip(curPage * PAGE_SIZE);

    if (startDate) {
      query.greaterThan('createdAt', startDate);
    }

    var pagePromise = query.find(options);

    pagePromise.done(function(pageResults) {
      pageResults.forEach(function(result) { stitchedResults.push(result); });
      var maxBatchSize = pageResults.length === PAGE_SIZE;
      var lastResult = stitchedResults[stitchedResults.length - 1];

      if (maxBatchSize) {
        if (curPage + 1 < MAX_QUERIES) {
          getNextPage(curPage + 1, startDate);
        } else if (options.superStitch) {
          getNextPage(0, lastResult.createdAt);
        } else {
          stitchedPromise.resolve(stitchedResults);
        }
      } else {
        stitchedPromise.resolve(stitchedResults);
      }

    });
    pagePromise.fail(stitchedPromise.reject);
  };

  getNextPage(0);
  return stitchedPromise;
};

module.exports = StitchQuery;
