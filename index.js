'use strict';

const Parse = require('parse-shim');

//
// Run the specified parse query multiple times, modifying skip/limit each
// time to download all available objects. Return a promise with the stitched
// results from all individual queries. This works around the limit of 1000
// results per parse query.
//
// For safety, unless superStitch is specified, this limits the total number
// of queries to 10, yielding an effective max of 10,000 results.
//
// If 'superStitch' is specified, results are ordered and additionally paged
// by the 'createdAt' date field after exhausting the 10k skip. This effectively
// allows a query to yield unlimited results.
//
// @param query {Parse.Query} The query to stitch.
// @param superStitch {Boolean} If you want more than 10k rows you can superStitch.
//
// NOTE: superStitch is not suitable for use with a sort (as it applies its own sort on createdAt)
// NOTE: This will modify the specified query, do not reuse the query after calling this function.
//
function StitchQuery(query, superStitch) {
  const pageSize = 1000;
  const maxQueries = 10;

  query.limit(pageSize);

  if (superStitch) {
    query.ascending('createdAt');
  }

  const stitchedPromise = new Parse.Promise();
  const stitchedResults = [];
  function getNextPage(curPage, startDate) {
    query.skip(curPage * pageSize);

    if (startDate) {
      query.greaterThan('createdAt', startDate);
    }

    const pagePromise = query.find();

    pagePromise.done((pageResults) => {
      pageResults.forEach(result => { stitchedResults.push(result); });
      const maxBatchSize = pageResults.length === pageSize;
      const lastResult = stitchedResults[stitchedResults.length - 1];

      if (maxBatchSize) {
        if (curPage + 1 < maxQueries) {
          getNextPage(curPage + 1, startDate);
        } else if (superStitch) {
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
