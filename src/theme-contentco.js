import extend from 'extend';
import Emitter from 'quill/core/emitter';
import BaseTheme, { BaseTooltip } from 'quill/themes/base';
import LinkBlot from 'quill/formats/link';
import { Range } from 'quill/core/selection';
var icons = Quill.import('ui/icons');

var Toolbar = Quill.import('modules/toolbar');

const TOOLBAR_CONFIG = [
    ['bold', 'italic', 'underline', 'link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],['link']
];

class Contentco extends BaseTheme {
  constructor(quill, options) {
    if (options.modules.toolbar != null && options.modules.toolbar.container == null) {
      options.modules.toolbar.container = TOOLBAR_CONFIG;
    }
    super(quill, options);
    this.quill.container.classList.add('ql-bubble');
    this.quill.container.classList.add('ql-hybrid');
  }

  extendToolbar(toolbar) {
    toolbar.container.classList.add('ql-bubble');
    this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), icons);
    this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), icons);
    this.tooltip = new ContentTooltip(this.quill, this.options.bounds);
    this.tooltip.root.appendChild(toolbar.container);

    if (toolbar.container.querySelector('.ql-link')) {
      this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function(range, context) {
        toolbar.handlers['link'].call(toolbar, !context.format.link);
      });
    }
  }
}



class ContentTooltip extends BaseTooltip {
  constructor(quill, bounds) {
    super(quill, bounds);
    this.quill.on(Emitter.events.EDITOR_CHANGE, (type, range, oldRange, source) => {
      if (type !== Emitter.events.SELECTION_CHANGE) return;
      if (range != null && range.length > 0 && source === Emitter.sources.USER) {
        this.show();
        // Lock our width so we will expand beyond our offsetParent boundaries
        this.root.style.left = '0px';
        this.root.style.width = '';
        this.root.style.width = this.root.offsetWidth + 'px';
        let lines = this.quill.getLines(range.index, range.length);
        if (lines.length === 1) {
          this.position(this.quill.getBounds(range));
          this.position({bottom:this.quill.getBounds(range).bottom,height:this.quill.getBounds(range).height,left:this.quill.container.offsetWidth - this.quill.getBounds(range).width/2,right: 0,top:this.quill.getBounds(range).top,width:this.quill.getBounds(range).width});
        } else {
          let lastLine = lines[lines.length - 1];
          let index = this.quill.getIndex(lastLine);
          let length = Math.min(lastLine.length() - 1, range.index + range.length - index);
          let bounds = this.quill.getBounds(new Range(index, length));
          this.position(bounds);
        }
      } else if (document.activeElement !== this.textbox && this.quill.hasFocus()) {
        this.hide();
      }
    });
  }

  listen() {
    super.listen();
    this.root.querySelector('.ql-close').addEventListener('click', () => {
      this.root.classList.remove('ql-editing');
    });
    this.quill.on(Emitter.events.SCROLL_OPTIMIZE, () => {
      // Let selection be restored by toolbar handlers before repositioning
      setTimeout(() => {
        if (this.root.classList.contains('ql-hidden')) return;
        let range = this.quill.getSelection();
        if (range != null) {
          this.position(this.quill.getBounds(range));
        }
      }, 1);
    });
  }

  cancel() {
    this.show();
  }

  position(reference) {
    let shift = super.position(reference);
    let arrow = this.root.querySelector('.ql-tooltip-arrow');
    if (arrow) {
      arrow.style.marginLeft = '';
      if (shift === 0) return shift;
      arrow.style.marginLeft = (-1*shift - arrow.offsetWidth/2) + 'px';
    }

  }
}
ContentTooltip.TEMPLATE = [
  '<div class="ql-tooltip-editor">',
    '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">',
    '<a class="ql-close"></a>',
  '</div>'
].join('');

Quill.register('themes/contentco', Contentco);


class InlineToolbar extends Toolbar {
  constructor(quill, options) {
    super(quill, options);
    // console.log(this.options);
    // if (Array.isArray(this.options.container)) {
    //   let container = document.createElement('div');
    //   addControls(container, this.options.container);
    //   quill.container.parentNode.insertBefore(container, quill.container);
    //   this.container = container;
    // }

    this.container.classList.add('ql-toolbar-hybrid');
  }
}

function addControls(container, groups) {
  if (!Array.isArray(groups[0])) {
    groups = [groups];
  }
  groups.forEach(function(controls) {
    let group = document.createElement('span');
    group.classList.add('ql-formats');
    controls.forEach(function(control) {
      if (typeof control === 'string') {
        addButton(group, control);
      } else {
        let format = Object.keys(control)[0];
        let value = control[format];
        if (Array.isArray(value)) {
          addSelect(group, format, value);
        } else {
          addButton(group, format, value);
        }
      }
    });
    container.appendChild(group);
  });
}

function addSelect(container, format, values) {
  let input = document.createElement('select');
  input.classList.add('ql-' + format);
  values.forEach(function(value) {
    let option = document.createElement('option');
    if (value !== false) {
      option.setAttribute('value', value);
    } else {
      option.setAttribute('selected', 'selected');
    }
    input.appendChild(option);
  });
  container.appendChild(input);
}

InlineToolbar.DEFAULTS = {};


function addButton(container, format, value) {
  let input = document.createElement('button');
  input.setAttribute('type', 'button');
  input.classList.add('ql-' + format);
  if (value != null) {
    input.value = value;
  }
  container.appendChild(input);
}


Quill.register('modules/inline_toolbar', InlineToolbar);
