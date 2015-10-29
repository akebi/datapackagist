require('fileapi');

var _ = require('underscore');
var backbone = require('backbone');
var backboneBase = require('backbone-base');
var dialogs = require('./dialog');
var request = require('superagent-bluebird-promise');
var validator = require('validator');
var uploadTpl = require('./templates/upload-dialog.hbs');

var updateUI = function(fileNameOrUrl) {
  var noSelection = $('#step1-no-file-selected');
  var currentSelection = $('#step1-selected-file');
  if (fileNameOrUrl) {
    noSelection.hide();
    currentSelection.show().find('span').text(fileNameOrUrl);
  } else {
    noSelection.show();
    currentSelection.hide().find('span').empty();
  }
};

// Unified file/URL upload dialog
module.exports = dialogs.BaseModalView.extend({
  activate: function(state) {
    dialogs.BaseModalView.prototype.activate.call(this, state);
    this.activateError(false);

    if(state !== false)
      this.$('[data-id=file-input], [data-id=url-input]').val('');

    return this;
  },

  activateError: function(state) {
    var hasError = _.isUndefined(state) || state;


    this.$('[data-id="url-form-row"]').toggleClass('has-error', hasError);
    this.$('[data-id="url-error"]').prop('hidden', !hasError);
  },

  events: _.extend(_.clone(dialogs.BaseModalView.prototype.events), {
    'click [data-id="upload-url"]': 'uploadURL',

    'keyup [data-id="url-input"]': function(E) {
      if(E.keyCode === 13)
        this.uploadURL();
    },

    'change [data-id="file-input"]': function(E) {
      window.APP.layout.uploadDialog.deactivate();
      window.APP.layout.splashScreen.activate();

      FileAPI.readAsText(FileAPI.getFiles(E.currentTarget)[0], (function (EV) {
        if(EV.type === 'load') {
          updateUI(EV.target.name);
          this.callbacks.data(EV.target.name, EV.result);
        }
        else if(EV.type ==='progress')
          this.setProgress(EV.loaded/EV.total * 100);
      }).bind(this));
    }
  }),

  render: function() { this.$el.html(this.template()); return this; },
  setMessage: function(message) { this.$('[data-id=message]').html(message); return this; },
  setProgress: function(percents) { return this; },
  template: uploadTpl,

  uploadURL: function() {
    var url = this.$('[data-id=url-input]').val();


    this.activateError(false);

    if(!validator.isURL(url)) {
      this.activateError();
      return this;
    }

    window.APP.layout.uploadDialog.deactivate();
    window.APP.layout.splashScreen.activate();

    request.get(url).then((function(RES) {
      updateUI(url);
      window.APP.layout.splashScreen.deactivate();
      this.callbacks.data(url, RES.text);
    }).bind(this));
  }
});
