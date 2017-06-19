/* tslint:disable:quotemark */
import {assert} from 'chai';

import {ParseNode} from '../../../src/compile/data/formatparse';
import {Model, ModelWithField} from '../../../src/compile/model';
import * as log from '../../../src/log';
import {parseFacetModel, parseUnitModel} from '../../util';

function parse(model: ModelWithField) {
  return ParseNode.make(model).assembleFormatParse();
}

describe('compile/data/formatparse', () => {
  describe('parseUnit', () => {
    it('should return a correct parse for encoding mapping', () => {
      const model = parseUnitModel({
        "data": {"url": "a.json"},
        "mark": "point",
        "encoding": {
          "x": {"field": "a", "type": "quantitative"},
          "y": {"field": "b", "type": "temporal"},
          "color": {"field": "c", "type": "ordinal"},
          "shape": {"field": "d", "type": "nominal"}
        }
      });

      assert.deepEqual(parse(model), {
        a: 'number',
        b: 'date'
      });
    });

    it('should return a correct customized parse.', () => {
      const model = parseUnitModel({
        "data": {"url": "a.json", "format": {"parse": {"c": "number", "d": "date"}}},
        "mark": "point",
        "encoding": {
          "x": {"field": "a", "type": "quantitative"},
          "y": {"field": "b", "type": "temporal"},
          "color": {"field": "c", "type": "ordinal"},
          "shape": {"field": "c", "type": "nominal"}
        }
      });

      assert.deepEqual(parse(model), {
        a: 'number',
        b: 'date',
        c: 'number',
        d: 'date'
      });
    });

    it('should include parse for all applicable fields, and exclude calculated fields', function() {
      const model = parseUnitModel({
        transform: [{calculate: 'datum["b"] * 2', as: 'b2'}],
        mark: "point",
        encoding: {
          x: {field: 'a', type: "temporal"},
          y: {field: 'b', type: "quantitative"},
          color: {field: '*', type: "quantitative", aggregate: 'count'},
          size: {field: 'b2', type: "quantitative"},
        }
      });

      assert.deepEqual(parse(model), {
        'a': 'date',
        'b': 'number'
      });
    });

    it('should not parse the same field twice', function() {
      const model = parseFacetModel({
        data: {
          values: [],
          format: {
            parse: {
              a: 'number'
            }
          }
        },
        facet: {
          row: {field: 'a', type: 'ordinal'}
        },
        spec: {
          mark: "point",
          encoding: {
            x: {field: 'a', type: "quantitative"},
            y: {field: 'b', type: "temporal"}
          }
        }
      });

      assert.deepEqual(parse(model), {
        'a': 'number'
      });
      model.parseScale();
      model.parseData();

      assert.deepEqual(model.child.component.data.ancestorParse, {
        'a': 'number',
        'b': 'date'
      });

      // set the ancestor parse to see whether fields from it are not parsed
      model.child.component.data.ancestorParse = {a: 'number'};
      assert.deepEqual(parse(model.child as ModelWithField), {
        'b': 'date'
      });
    });
  });

  describe('assembleTransforms', function() {
    it('should assemble correct parse expressions', function() {
      const p = new ParseNode({
        n: 'number',
        b: 'boolean',
        s: 'string',
        d1: 'date',
        d2: 'date:"%y"',
        d3: 'utc:"%y"'
      });

      assert.deepEqual(p.assembleTransforms(), [
        {type: 'formula', expr: 'toNumber(datum["n"])', as: 'n'},
        {type: 'formula', expr: 'toBoolean(datum["b"])', as: 'b'},
        {type: 'formula', expr: 'toString(datum["s"])', as: 's'},
        {type: 'formula', expr: 'toDate(datum["d1"])', as: 'd1'},
        {type: 'formula', expr: 'timeParse(datum["d2"],"%y")', as: 'd2'},
        {type: 'formula', expr: 'utcParse(datum["d3"],"%y")', as: 'd3'}
      ]);
    });

    it('should show warning for unrecognized types', function() {
      log.runLocalLogger((localLogger) => {
        const p = new ParseNode({
          x: 'foo',
        });

        assert.deepEqual(p.assembleTransforms(), []);
        assert.equal(localLogger.warns[0], log.message.unrecognizedParse('foo'));
      });
    });
  });
});
