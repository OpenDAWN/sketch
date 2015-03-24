'use strict';

const d3 = require('d3');
const debug = require('debug')('sketch:svg');

const data = require('./data.js');

let e = {};

e.SketchSVG = class {
  constructor(parent, width, height) {
    const that = this;
    this.parent = parent;
    this.data = this.parent.data;
    this.domain = this.parent.domain;
    this.width = width;
    this.height = height;

    this.x = d3.scale.linear()
      .domain(this.domain.x)
      .range([0, this.width]);

    this.y = d3.scale.linear()
      .domain(this.domain.y)
      .range([0, this.height]);

    this.$selection = this.parent.$selection.append('g')
      .attr('transform', 'translate(0,0)') // margins
      .append('svg')
      .attr('class', 'sketch-svg')
      .attr('id', this.parent.id.replace(/.*-/, 'sketch-svg-'))
      .attr('width', this.width)
      .attr('height', this.height)    // .attr('pointer-events', 'all')
      .on('click.svg', function () {
        if(d3.event.defaultPrevented) {
          debug('svg click prevented');
          return;
        }

        if(that.parent.control.mode === 'add') {
          const [x, y] = d3.mouse(this);
          that.data.addPoint( {x: that.x.invert(x),
                               y: that.y.invert(y) });
          that.update();
        }
      });

    this.brush = d3.svg.brush()
      .x(this.x)
      .y(this.y)
      .on('brush', () => { this.brushed(); } )
      .on('brushend', () => { this.brushended(); } );

    this.drag = d3.behavior.drag()
      .origin(function(d) {
        return { x: that.x(d.x),
                 y: that.y(d.y) };
      }) // origin
      .on('drag.svg', function (d) {
        if(d3.event.defaultPrevented) {
          debug('svg click prevented');
          return;
        }

        let $move = d3.select(this);
        if($move.classed('selected') ) {
          $move = e.sistersSelectedSelection($move);
        }

        const translate = { x: d3.event.x - that.x(d.x),
                            y: d3.event.y - that.y(d.y) };
        $move.attr('transform', function (d2) {
          return 'translate(' + (that.x(d2.x) + translate.x) + ','
            + (that.y(d2.y) + translate.y) + ')';
        });

        d3.event.sourceEvent.stopPropagation();
      }) // drag
      .on('dragend.svg', function () {
        let $moved = d3.select(this);
        if($moved.classed('selected') ) {
          $moved = e.sistersSelectedSelection($moved);
        }

        let updated = false;
        for (let s = 0; s < $moved[0].length; ++s) {
          let avatar = $moved[0][s].__data__;
          const index = that.data.values.findIndex( (element) => {
            return data.point.same(element, avatar);
          });

          if(index >= 0 && index < that.data.values.length) {
            let original = that.data.values[index];
            const translate = d3.transform(d3.select($moved[0][s])
                                           .attr('transform')).translate;
            original.x = that.x.invert(translate[0]);
            original.y = that.y.invert(translate[1]);
            updated = true;
          }
        } // each point of the selection

        if(updated) {
          that.update();
        }

      }); // dragend

    this.update();
  }

  update() {
    const that = this;

    // update
    const $updated = this.$selection.selectAll('.point')
            .data(this.data.values)
            .attr('transform', (d) => {
              return 'translate(' + this.x(d.x) + ',' + this.y(d.y) + ')';
            });

    // exit
    $updated
      .exit()
      .remove();

    // enter
    $updated
      .enter().append('g')
      .attr('class', 'point')
      .attr('transform', (d) => {
        return 'translate(' + this.x(d.x) + ',' + this.y(d.y) + ')';
      })
      .on('click', function (d, i) {
        if(d3.event.defaultPrevented) {
          debug('svg click prevented');
          return;
        }

        switch(that.parent.control.mode) {
        case 'add':
          e.invertSelection(d3.select(this));
          break;

        case 'select':
          e.invertSelection(d3.select(this));
          break;

        case 'delete':
          let $deleted = d3.select(this);
          if($deleted.classed('selected') ) {
            $deleted = e.sistersSelectedSelection($deleted);
          }

          let updated = false;
          for (let s = 0; s < $deleted[0].length; ++ s) {
            const avatar = $deleted[0][s].__data__;
            const index = that.data.values.findIndex( (element) => {
              return data.point.same(element, avatar);
            });

            if(index >= 0 && index < that.data.values.length) {
              that.data.values.splice(index, 1);
              // remove selection (which is index-based)
              d3.select($deleted[0][s]).classed('selected', false);
              updated = true;
            }
          } // for each point of the selection

          if(updated) {
            that.update();
          }
          break;

        case 'move':
          e.invertSelection(d3.select(this));
          break;
        }

        d3.event.stopPropagation();
      }) // circle clicked

      .call(this.drag)

      .each( function (d, i, e) {
        debug('added %s, %, %s', d, i, e);

        const $point = d3.select(this);

        $point.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', function (d) {
            // font-size must be a style attribute of point
            return parseFloat(d3.select('.point').style('font-size') )
              * 0.666666666666666;
          });

        $point.append('text')
          .attr('class', 'label')
          .text( function (d) { return (d.Id + 1).toString(); })
          .attr('dy', '0.3333333333333333em');
      });

  }

  brushed() {
    const $point = this.$selection.selectAll('.point');
    const extent = this.brush.extent();
    $point.each(function(d) { d.selected = false; });
    if(this.brush.empty() ) {
      debug('brush empty');
      // d3.event.target.extent(d3.select(this.parentNode));
      //  d3.select(this.parentNode).event(svgClick);
    } else {
      $point.classed('selected', function(d) {
        return d.x >= extent[0][0] && d.x <= extent[1][0]
          && d.y >= extent[0][1] && d.y <= extent[1][1];
      });
    }
  }

  brushended() {
    if (!d3.event.sourceEvent) {
      debug('brush not not source');
      // only transition after input
      return;
    }
    debug('brush source event');
  }

  brushRemove() {
    d3.selectAll(this.$selection.node().childNodes)
      .filter('.brush').remove();
  }

  brushAdd() {
    if(d3.selectAll(this.$selection.node().childNodes)
       .filter('.brush')[0].length === 0) {
      this.$selection.insert('g', ':first-child')
        .attr('class', 'brush')
        .call(this.brush)
        .call(this.brush.event);
    }
  }

};

// helpers
e.invertSelection = function($point) {
  $point.classed('selected', !$point.classed('selected') );
};

e.sistersSelectedSelection = function($point) {
  return d3.selectAll($point.node().parentNode.childNodes)
    .filter('.selected');
};

module.exports = exports = e;
