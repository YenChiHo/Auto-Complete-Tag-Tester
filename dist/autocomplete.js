(function(window, document){
/*
 * Author : Yen-Chi Ho
 * Email : yenchiho@gmail.com
 * 
 */


//For Creating Tab & Widget divs
function nodeList2array(list) {
  return Array.prototype.slice.call(list);
}

function insertAfter(newNode, refNode){
  refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
}

function html2elem(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  var elem = div.firstChild;
  return elem;
}

function createInputWidget() {
  var div = document.createElement('div'),
      widgetHTML =
        '<div class="autocompletebar widget">' +
        '  <span class="autocompletebar tags">' +
        '  </span>' +
        '  <div class="autocompletebar input">' +
        '    <input class="autocompletebar text-field" type="text">' +
        '    <div class="autocompletebar menu">' +
        '    </div>' +
        '  </div>' +
        '</div>';

  return html2elem(widgetHTML);
}

function createTag(text) {
  var tagHTML =
      '<span class="autocompletebar tag">' + text +
      '<span class="autocompletebar removebutton">&times</span>' +
      '</span>';
  return html2elem(tagHTML);
}

function createMenuItem(text) {
  var itemHTML = '<div class="autocompletebar menu-item">' + text + '</div>';
  return html2elem(itemHTML);
}

function addClass(elem, className) {
  if (elem.className.indexOf(className) === -1) {
    elem.className += ' ' + className;
  }
}

function removeClass(elem, className) {
  if (elem.className.indexOf(className) !== -1) {
    elem.className = elem.className.replace(className, '').trim();
  }
}


// Event Handlers
function makeTextField(elem){
  function value(){
    if (arguments.length === 0) {
      return elem.value;
    }
    return (elem.value = arguments[0]);
  }
  return {
    value: value,
    clear: function(){ elem.value = ''; }
  };
}

function makeTags(container, tagRemoveHandler){
  var tags = [],
      inputDiv = container.querySelector('.autocompletebar.input');
  function contains(text) {
    return function(tag){
      return tag.text === text;
    };
  }
  function add(text) {
    if (tags.some(contains(text))) //Eliminate Duplicate Tags
      return;
    var tagElem = createTag(text),
        closeElem = tagElem.querySelector('.autocompletebar.removebutton');
    closeElem.addEventListener('click', function(e){
      remove(text);
      tagRemoveHandler(e);
    });
    container.insertBefore(tagElem, inputDiv);
    tags.push({
      text: text,
      elem: tagElem
    });
  }
  function remove(text) {
    if (!tags.some(contains(text)))
      return;
    var tag = tags.filter(contains(text))[0];
    container.removeChild(tag.elem);
    tags.splice( tags.indexOf(tag), 1 );
  }
  function data() {
    return tags.map(function(tag){ return tag.text; });
  }
  return {
    add: add,
    remove: remove,
    data: data
  };
}
//Key Tracking  with Menu Selection
function makeMenu(container, items, itemClickHandler){
  var focusedItem;
  function hideMenu() {
    addClass(container, 'hide');
  }
  function showMenu() {
    removeClass(container, 'hide');
  }
  function update(text) {
    function containsText(s) {
      return s.search(new RegExp(text, 'i')) !== -1;
    }
    function mouseover(item) {
      return function() {
        if (focusedItem)
          defocus();
        focus(item);
      };
    }
    removeMenuItems();
    items.filter(containsText)
      .slice(0,6)
      .map(createMenuItem)
      .map(function(item){
        item.addEventListener('click', itemClickHandler);
        item.addEventListener('mouseover', mouseover(item));
        item.addEventListener('mouseout', defocus);
        container.appendChild(item);
      });
    focusedItem = null;
  }

  function removeMenuItems() {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
  //Item generation
  function hasItems() {
    return container.hasChildNodes();
  }

  function focus(elem) {
    addClass(elem, 'focus');
    focusedItem = elem;
  }
  function defocus() {
    if (focusedItem)
      removeClass(focusedItem, 'focus');
    focusedItem = null;
  }
  function focusDown() {
    if (!container.hasChildNodes()) return;
    if (!focusedItem) {
      focus(container.firstChild);
      return;
    }
    if (focusedItem.nextSibling) {
      var elem = focusedItem.nextSibling;
      defocus();
      focus(elem);
      return;
    }
  }
  function focusUp() {
    if (focusedItem && !focusedItem.previousSibling) {
      defocus();
      return;
    }
    if (focusedItem && focusedItem.previousSibling) {
      var elem = focusedItem.previousSibling;
      defocus();
      focus(elem);
      return;
    }
  }
  function hasFocusedItem() {
    return !!focusedItem;
  }
  function focusedItemText() {
    return focusedItem.innerText;
  }
  return {
    hide: hideMenu,
    show: showMenu,
    update: update,
    hasItems: hasItems,
    focusDown: focusDown,
    focusUp: focusUp,
    hasFocusedItem: hasFocusedItem,
    focusedItemText: focusedItemText
  };
}

// Modules and Bindings
function makeWidget(origInputElem, items){
  var widgetElem = createInputWidget(),
      menuElem = widgetElem.querySelector('.autocompletebar.menu'),
      textFieldElem = widgetElem.querySelector('.autocompletebar.text-field'),
      tagsElem = widgetElem.querySelector('.autocompletebar.tags'),

      origInput = makeTextField( origInputElem ),
      textField = makeTextField( textFieldElem ),
      tags = makeTags( tagsElem, closeClicked ),
      menu = makeMenu( menuElem, items, menuItemClicked ),

      downKey = 40,
      upKey = 38,
      enterKey = 13,
      special_keys = [downKey, upKey, enterKey];

  function updateOriginalInputValue() {
    origInput.value( tags.data().join(',') );
  }

  function closeClicked(e) {
    updateOriginalInputValue();
  }

  function addTagWorkflow(text) {
    tags.add(text);
    updateOriginalInputValue();
    menu.hide();
    textField.clear();
    textFieldElem.focus();
  }

  function menuItemClicked(e) {
    addTagWorkflow(e.target.innerText);
  }

  // Initialization
  origInputElem.type = 'hidden';
  insertAfter(widgetElem, origInputElem);
  menu.hide();

  textFieldElem.addEventListener('keydown', function(e){
    if (e.keyCode === downKey)
      menu.focusDown();
  });
  textFieldElem.addEventListener('keydown', function(e){
    if (e.keyCode === upKey)
      menu.focusUp();
  });
  textFieldElem.addEventListener('keydown', function(e){
    if (e.keyCode === enterKey && menu.hasFocusedItem())
      addTagWorkflow(menu.focusedItemText());
  });
  textFieldElem.addEventListener('keyup', function(e){
    var input = textField.value();
    if (input === '') {
      // Stop user from generating invisible DOM nodes by eliminating empty entry
      return;
    }
    if (special_keys.indexOf(e.keyCode) === -1)
      menu.update(input);
  });
  textFieldElem.addEventListener('keyup', function(){
    if (!menu.hasItems() || textField.value() === '')
      menu.hide();
    else
      menu.show();
  });
  return {};
}


function bind(elem, data) {
  if (!data || !Array.isArray(data))
    throw 'Data should be an array of string';

  if (elem.tagName !== 'INPUT')
    throw 'AutoComplete can only bind to an input element';

  makeWidget(elem, data);
}

// Public API
var AutoComplete = window.AutoComplete || (window.AutoComplete = {});
AutoComplete.bind = bind;


}(window, document));
