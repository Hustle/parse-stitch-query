'use strict';

const Parse = require('parse-shim');

const ParseMockDB = require('parse-mockdb');
const StitchQueryP = require('./index');
const expect = require('chai').expect;

class Obj extends Parse.Object {
  constructor() {
    super('Obj');
  }
};

function saveObjsP(count) {
  const objsToSave = [];
  for (let i=0; i<count; i++) {
    const obj = new Obj();
    objsToSave.push(obj);
  }
  return Parse.Object.saveAll(objsToSave);
}

describe('StitchQueryP', function() {
  beforeEach(function() {
    Parse.MockDB.mockDB();
  });

  afterEach(function() {
    Parse.MockDB.cleanUp();
  });

  context('when we have exactly 100 objects in collection', function() {
    it('returns all of the expected results', function() {
      return saveObjsP(100).then((objs) => {
        return StitchQueryP(new Parse.Query(Obj))
      }).then((results) => {
        expect(results).to.have.lengthOf(100);
      })
    });
  });

  context('when we have exactly 1000 objects in collection', function() {
    it('returns all of the expected results', function() {
      return saveObjsP(1000).then((objs) => {
        return StitchQueryP(new Parse.Query(Obj))
      }).then((results) => {
        expect(results).to.have.lengthOf(1000);
      })
    });
  });

  context('when we have more than 1000 objects in collection', function() {
    it('returns all of the expected results', function() {
      return saveObjsP(1001).then((objs) => {
        return StitchQueryP(new Parse.Query(Obj))
      }).then((results) => {
        expect(results).to.have.lengthOf(1001);
      })
    });
  });

  context('when we have exactly 10000 objects in collection', function() {
    it('returns all of the expected results @slow', function() {
      this.timeout(30000);
      return saveObjsP(10000).then((objs) => {
        return StitchQueryP(new Parse.Query(Obj))
      }).then((results) => {
        expect(results).to.have.lengthOf(10000);
      })
    });
  });

  context('when we have greater than 10000 objects in collection', function() {
    it('returns returns only 10k of the expected results @slow', function() {
      this.timeout(30000);
      return saveObjsP(10100).then((objs) => {
        return StitchQueryP(new Parse.Query(Obj))
      }).then((results) => {
        expect(results).to.have.lengthOf(10000);
      })
    });

    context('using super stitch query', function() {
      it('returns all of the expected results @slow', function() {
        this.timeout(30000);
        return saveObjsP(10100).then((objs) => {
          return StitchQueryP(new Parse.Query(Obj), {superStitch: true})
        }).then((results) => {
          expect(results).to.have.lengthOf(10100);
        })
      });
    });
  })
});
