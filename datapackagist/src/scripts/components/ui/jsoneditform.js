var jsonEditor = require('json-editor');
var _ = require('underscore');
var backbone = require('backbone');
var deepEmpty = require('deep-empty');
var omitEmpty = require('omit-empty');

var JSONEditorView = JSONEditor;

JSONEditorView.prototype.init = _.wrap(JSONEditorView.prototype.init, function(init) {
  var formData;


  init.apply(this, _.rest(arguments));

  this.on('ready', (function() {
    // Remove Top-level collapse button
    this.root.toggle_button.remove();

    // Detecting changes
    this.changed = false;

    // After `ready` event fired, editor fire `change` event regarding to the initial changes
    this.on('change', _.after(2, (function() {
      var resources = this.getEditor('root.resources');
      var resourcesLength = _.result(resources.rows, 'length');


      this.changed = true;

      // Expand resources section if there are any resources, collapse if row is empty
      if(resourcesLength && resources.collapsed || !resourcesLength && !resources.collapsed)
        $(resources.toggle_button).trigger('click');

      // Do not allow changing schema field type — disable type selectbox
      $('[data-schemapath]:not([data-schematype]) select.form-control', this.element).prop('hidden', true);
    }).bind(this)));

    // Collapse editor and add empty item if it has no value
    _.each($('[data-schemapath^="root."]:has(.json-editor-btn-collapse)', this.element), function(E) {
      var editor = this.getEditor($(E).data('schemapath'));
      var isEmpty = _.isEmpty(editor.getValue());

      // Empty array data should have one empty item
      if(_.contains(['resources'], E.dataset.schemapath.replace('root.', '')) && !editor.rows.length)
        $(editor.add_row_button).trigger('click');

      if(isEmpty && !editor.collapsed)
        $(editor.toggle_button).trigger('click');
    }, this);

    // Looks like previous loop is somehow async
    setTimeout((function() { $('#json-code').prop('hidden', false); }).bind(this), 300);

    // If on the previous form was entered values try to apply it to new form
    if(formData)
      this.layout.form.setValue(_.extend({}, this.layout.form.getValue(formData), formData));

    // Remove collapse button on add new item in collection
    _.each($('[data-schemapath][data-schemapath!=root]:has(.json-editor-btn-add)', this.element), function(E) {
      var
        editor = this.getEditor($(E).data('schemapath'));

      $(_.pluck(editor.rows, 'toggle_button')).remove();

      $(editor.add_row_button).click((function() {
        $(_.last(this.rows).toggle_button).remove();
      }).bind(editor));
    }, this);
  }).bind(this));
});

  // Omit empty properties and "0" values of object properties put into array.
  // Stick with that complex solution because "0" is the default value
JSONEditorView.prototype.getCompactValue = function () { return deepEmpty(this.getValue(), function(O) {
  return !_.isEmpty(O) && !_.every(O, function(I) { return _.isEmpty(omitEmpty(I, true)); })
}); };

// Proper representation of all form buttons. Avoid changing each newly
// rendered button by rewriting the .getButton()
JSONEditor.defaults.themes.bootstrap3.prototype.getButton = function(text, icon, title) {
  var el = document.createElement('button');

  el.type = 'button';
  el.className += 'btn btn-info btn-sm';
  this.setButtonText(el,text,icon,title);
  return el;
};

module.exports.JSONEditorView = JSONEditorView;