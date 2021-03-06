'use strict';

const d3 = require('d3');
const debug = require('debug')('sketch:control');

let e = {};

e.SketchControl = class {
  constructor(parent) {
    const that = this;
    this.parent = parent;
    this.structure = this.parent.structure;

    this.id = this.parent.id.replace(/.*-/, 'sketch-control-');

    this.$selection = this.parent.$selection.append('div')
      .attr('class', 'sketch-control')
      .attr('id', this.id);

    ///// preset
    this.$preset = this.$selection.append('div')
      .attr('class', 'sketch-control-preset')
      .attr('id', parent.id.replace(/.*-/, 'sketch-preset-'));

    this.$preset.append('button')
      .attr('class', 'sketch-control-element')
      .classed('save', true)
      .text('Save')
      .on('click', () => { this.savePreset(); });

    this.$presetList = this.$preset.append('select')
      .attr('class', 'sketch-control-element')
      .classed('list', true)
      .on('change', () => {
        if(d3.event.defaultPrevented) {
          debug('preset list change prevented');
          return;
        }
        that.loadPreset(this.$presetList.node().value);
        d3.event.stopPropagation();
      });

    this.$preset.append('button')
      .attr('class', 'sketch-control-element')
      .classed('delete', true)
      .text('Delete')
      .on('click', () => { this.deletePreset(); });

    ///// mode
    this.mode = null;
    this.$mode = this.$selection.append('div')
      .attr('class', 'sketch-control-mode');

    this.$mode.append('button')
      .attr('class', 'sketch-control-element')
      .classed('add', true)
      .text('Add')
      .on('click', () => { this.setMode('add'); });

    this.$mode.append('button')
      .attr('class', 'sketch-control-element')
      .classed('select', true)
      .text('Select')
      .on('click', () => { this.setMode('select'); });

    this.$mode.append('button')
      .attr('class', 'sketch-control-element')
      .classed('delete', true)
      .text('Delete')
      .on('click', () => { this.setMode('delete'); });

    this.$mode.append('button')
      .attr('class', 'sketch-control-element')
      .classed('move', true)
      .text('Move')
      .on('click', () => { this.setMode('move'); });

    this.setMode('add');

    ///// options
    this.$modeOptions = this.$selection.append('div')
      .attr('class', 'mode-options');
      // .style('display', this.mode === 'add' ? null : 'none')

    this.$modeOptions.append('button')
      .attr('class', 'sketch-control-element')
      .text('-')
      .on('click', () => { this.parent.decrementSelectedId(); } );

    this.$modeOptions.append('label')
      .attr('class', 'sketch-control-element')
      .text('#');

    this.$modeOptions.append('button')
      .attr('class', 'sketch-control-element')
      .text('+')
      .on('click', () => { this.parent.incrementSelectedId(); } );

    this.updatePresetList();
  }

  setMode(mode) {
    // exclusive
    let sisters = d3.selectAll(this.$mode.node().childNodes)
      .classed('selected', false);

    switch(mode) {
    case 'add':
      sisters.filter('.add').classed('selected', true);
      this.brushRemove();
      break;
    case 'select':
      sisters.filter('.select').classed('selected', true);
      this.brushAdd();
      break;
    case 'delete':
      sisters.filter('.delete').classed('selected', true);
      this.brushRemove();
      break;
    case 'move':
      sisters.filter('.move').classed('selected', true);
      this.brushRemove();
      break;
    }
    this.mode = mode;
    return this;
  }

  deletePreset() {
    const name = window.prompt('Really delete ?', this.parent.data.name);
    if(name && this.structure.setNameExists(name) ) {
      debug('%s deleted', name);
      this.structure.removeSetByName(name);
      this.updatePresetList();
    }

    return this;
  }

  savePreset() {
    const name = window.prompt('Name', this.parent.data.name);
    if(name
       && (!this.structure.setNameExists(name)
           || window.confirm('Update ' + name + '?') ) ) {
      debug('%s saved', name);
      this.structure.addSet(this.parent.data, name);

      // update all, including self
      this.parent.top.update();

      this.loadPreset(name);
    }

    return this;
  }

  loadPreset(name) {
    debug('load preset: %s', name);
    const set = this.structure.getSetByName(name);
    if(set) {
      this.parent.data.cloneFrom(set);
      this.$presetList.node().value = name;
      this.parent.update();
    } else {
      console.log('Unknown preset ' + name);
    }

    return this;
  }

  update() {
    this.updatePresetList();
    return this;
  }

  updatePresetList() {
    const that = this;

    // update
    const $updated = this.$presetList.selectAll('option')
      .data(this.structure.sets, function (d) { return d.name; } )
      .attr('value', (d) => { return d.name; })
      .text( (d) => { return d.name; });

    // exit
    $updated
      .exit()
      .remove();


    // enter
    $updated
      .enter().append('option')
      .attr('value', (d) => { return d.name; })
      .text( (d) => { return d.name; })
      .on('click', function (d) {
        if(d3.event.defaultPrevented) {
          debug('preset list click prevented');
          return;
        }

        that.loadPreset(d.name);
        d3.event.stopPropagation();
      });

    return this;
  }


  brushAdd() {
    if (typeof this.parent.svg !== 'undefined') {
      this.parent.svg.brushAdd();
    }
    return this;
  }

  brushRemove() {
    if (typeof this.parent.svg !== 'undefined') {
      this.parent.svg.brushRemove();
    }
    return this;
  }

}; // SketchControl class


module.exports = exports = e;
