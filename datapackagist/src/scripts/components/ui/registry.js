var backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var deep = require('deep-diff');


module.exports = {
  ListView: backbone.BaseListView.extend({
    events: {
      'change': function() {
        var
          schema = this.getSelectedSchema();

        $.getJSON(schema, (function(schemaData) {
          var
            // Keys of entered fields
            keys = _.keys(this.parent.getFilledValues());

          this.schemaData = schemaData;

          // If data can be lost - show confirmation message
          if(deep.diff(_.pick(schemaData.properties, keys), _.pick(this.parent.layout.form.schema.properties, keys)))
            return window.APP.layout.confirmationDialog
              .setMessage('Some data you have entered will be lost. Are you sure you want to change the Data Package Profile?')

              .setCallbacks({
                yes: (function() {
                  this.selectedValue = this.$(this.options.container).val();
                  this.parent.reset(schemaData);
                  window.APP.layout.confirmationDialog.deactivate();
                  return false;
                }).bind(this),

                no: (function() {
                  this.$(this.options.container).val(this.selectedValue);
                  window.APP.layout.confirmationDialog.deactivate();
                  return false;
                }).bind(this)
              })

              .activate();

          else this.selectedValue = this.$(this.options.container).val();

          this.parent.reset(schemaData);

        }).bind(this));
      }
    },

    getSchema: function() { return this.schemaData; },

    getSelectedSchema: function() {
      return this.collection.get(this.$(this.options.container).val()).get('schema');
    },

    ItemView: backbone.BaseView.extend({
      render: function() {
        this.$el
          .attr('value', this.model.cid)
          .html(this.model.get('title'));

        return this;
      },

      tagName: 'option'
    }),

    reset: function(collection) {
      backbone.BaseListView.prototype.reset.call(this, collection);
      this.selectedValue = this.$(this.options.container).val();

      $.getJSON(this.getSelectedSchema(), (function(schemaData) {
        this.schemaData = schemaData;
        this.parent.reset(schemaData);
      }).bind(this));

      return this;
    },

    tagName: 'select'
  })
};