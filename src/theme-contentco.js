import extend from 'extend';
import Emitter from 'quill/core/emitter';
import BaseTheme, { BaseTooltip } from 'quill/themes/base';
import LinkBlot from 'quill/formats/link';
import { Range } from 'quill/core/selection';

let ColorPicker = Quill.import('ui/color-picker');
let Picker = Quill.import('ui/picker');
let IconPicker = Quill.import('ui/icon-picker');
var icons = Quill.import('ui/icons');

var Toolbar = Quill.import('modules/toolbar');

const ALIGNS = [ false, 'center', 'right', 'justify' ];

const COLORS = [
  "#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff",
  "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff",
  "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff",
  "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2",
  "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466"
];

const FONTS = [ false, 'serif', 'monospace' ];

const HEADERS = [ '1', '2', '3', false ];

const SIZES = [ 'small', false, 'large', 'huge' ];

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
    this.quill.container.classList.add('ql-snow');
    this.quill.container.classList.add('ql-hybrid');
  }

  extendToolbar(toolbar) {
    toolbar.container.classList.add('ql-snow');
    toolbar.addHandler('link', this.linkEventHanlder);
    toolbar.addHandler('video', this.videoEventHanlder);

    this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), icons);
    this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), icons);
    this.tooltip = new SnowTooltip(this.quill, this.options.bounds);
    //this.tooltip.root.appendChild(toolbar.container);
    this.actionBtn = new ContentTooltip(this.quill, this.options.bounds);
    //this.actionBtn.root.appendChild(toolbar.container);
    // console.log('here',this);

    if (toolbar.container.querySelector('.ql-link')) {
      this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function(range, context) {
        toolbar.handlers['link'].call(toolbar, !context.format.link);
      });
    }
  }
  linkEventHanlder(){
    this.quill.theme.tooltip.edit('link');
    if (this.quill.theme.tooltip.root.offsetLeft < 0) {
      this.quill.theme.tooltip.root.style.left = '0px';
      this.quill.theme.tooltip.textbox.placeholder = '';
    }
  }

  videoEventHanlder(){
    this.quill.theme.tooltip.edit('video');
    if (this.quill.theme.tooltip.root.offsetLeft < 0) {
      this.quill.theme.tooltip.root.style.left = '0px';
    }
  }
}



class ContentTooltip {
  constructor(quill, boundsContainer) {
    this.quill = quill;
    this.boundsContainer = this.quill.container || document.body;
    this.root = quill.addContainer('ql-action');
    this.root.innerHTML = this.constructor.TEMPLATE;

    if (this.quill.root === this.quill.scrollingContainer) {
      this.quill.root.addEventListener('scroll', () => {
        this.root.style.marginTop = (-1*this.quill.root.scrollTop) + 'px';
      });
    }

    this.root.classList.add('ql-hidden');//testing

    this.quill.on(Emitter.events.EDITOR_CHANGE, (type, range, oldRange, source) => {
      if (type !== Emitter.events.SELECTION_CHANGE) return;
      if (range != null && range.length > 0 && source === Emitter.sources.USER) {
        this.show();
        let lines = this.quill.getLines(range.index, range.length);
        if (lines.length === 1) {
          this.position({bottom:this.quill.getBounds(range).bottom,
            height:this.quill.getBounds(range).height,left:this.quill.container.offsetWidth - this.quill.getBounds(range).width/2,
            right: this.root.offsetWidth/2,top:this.quill.getBounds(range).top,width:this.quill.getBounds(range).width});
        }
      } else if (document.activeElement !== this.textbox && this.quill.hasFocus()) {
        this.hide();
      }
    });
  }

  hide(){
    this.root.classList.add('ql-hidden');
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

  show() {
    this.root.classList.remove('ql-editing');
    this.root.classList.remove('ql-hidden');
  }

  position(reference) {
    console.log(reference);
    let right = reference.right;
    let top = reference.bottom + this.quill.root.scrollTop;
    this.root.style.right = '-'+ right + 'px';
    this.root.style.top = top + 'px';
  }
}
ContentTooltip.TEMPLATE = [].join('');

//Snow tooltip
class SnowTooltip extends BaseTooltip {
  constructor(quill, bounds) {
    super(quill, bounds);
    this.preview = this.root.querySelector('a.ql-preview');
  }

  listen() {
    super.listen();
    this.root.querySelector('a.ql-action').addEventListener('click', (event) => {
      if (this.root.classList.contains('ql-editing')) {
        this.save();
      } else {
        this.edit('link', this.preview.textContent);
      }
      event.preventDefault();
    });
    this.root.querySelector('a.ql-remove').addEventListener('click', (event) => {
      if (this.linkRange != null) {
        let range = this.linkRange;
        this.restoreFocus();
        this.quill.formatText(range, 'link', false, Emitter.sources.USER);
        delete this.linkRange;
      }
      event.preventDefault();
      this.hide();
    });
    this.quill.on(Emitter.events.SELECTION_CHANGE, (range, oldRange, source) => {
      if (range == null) return;
      if (range.length === 0 && source === Emitter.sources.USER) {
        let [link, offset] = this.quill.scroll.descendant(LinkBlot, range.index);
        if (link != null) {
          this.linkRange = new Range(range.index - offset, link.length());
          let preview = LinkBlot.formats(link.domNode);
          this.preview.textContent = preview;
          this.preview.setAttribute('href', preview);
          this.show();
          this.position(this.quill.getBounds(this.linkRange));
          return;
        }
      } else {
        delete this.linkRange;
      }
      this.hide();
    });
  }

  show() {
    super.show();
    this.root.removeAttribute('data-mode');
  }
}
SnowTooltip.TEMPLATE = [
  '<a class="ql-preview" target="_blank" href="about:blank"></a>',
  '<input type="text" data-formula="e=mc^2" data-link="https://quilljs.com" data-video="Embed URL">',
  '<a class="ql-action"></a>',
  '<a class="ql-remove"></a>'
].join('');

Quill.register('themes/contentco', Contentco);


class InlineToolbar extends Toolbar {
  constructor(quill, options) {
    super(quill, options);
    this.container.classList.add('ql-toolbar-hybrid');
    //this.container.classList.add('ql-snow');
    this.buildButtons([].slice.call(this.container.querySelectorAll('button')), icons);
    this.buildPickers([].slice.call(this.container.querySelectorAll('select')), icons);
    this.addHandler('link', this.linkEventHanlder);
    this.addHandler('video', this.videoEventHanlder);

    this.actionBtn = new ContentTooltip(this.quill, this.options.bounds);
    this.actionBtn.root.appendChild(this.container);
  }

  linkEventHanlder(){
    this.quill.theme.tooltip.edit('link');
    if (this.quill.theme.tooltip.root.offsetLeft < 0) {
      this.quill.theme.tooltip.root.style.left = '0px';
      this.quill.theme.tooltip.textbox.placeholder = '';
    }
  }

  videoEventHanlder(){
    this.quill.theme.tooltip.edit('video');
    if (this.quill.theme.tooltip.root.offsetLeft < 0) {
      this.quill.theme.tooltip.root.style.left = '0px';
    }
  }

  buildButtons(buttons, icons) {
    buttons.forEach((button) => {
      let className = button.getAttribute('class') || '';
      className.split(/\s+/).forEach((name) => {
        if (!name.startsWith('ql-')) return;
        name = name.slice('ql-'.length);
        if (icons[name] == null) return;
        if (name === 'direction') {
          button.innerHTML = icons[name][''] + icons[name]['rtl'];
        } else if (typeof icons[name] === 'string') {
          button.innerHTML = icons[name];
        } else {
          let value = button.value || '';
          if (value != null && icons[name][value]) {
            button.innerHTML = icons[name][value];
          }
        }
      });
    });
  }

  buildPickers(selects, icons) {
    this.pickers = selects.map((select) => {
      if (select.classList.contains('ql-align')) {
        if (select.querySelector('option') == null) {
          fillSelect(select, ALIGNS);
        }
        return new IconPicker(select, icons.align);
      } else if (select.classList.contains('ql-background') || select.classList.contains('ql-color')) {
        let format = select.classList.contains('ql-background') ? 'background' : 'color';
        if (select.querySelector('option') == null) {
          fillSelect(select, COLORS, format === 'background' ? '#ffffff' : '#000000');
        }
        return new ColorPicker(select, icons[format]);
      } else {
        if (select.querySelector('option') == null) {
          if (select.classList.contains('ql-font')) {
            fillSelect(select, FONTS);
          } else if (select.classList.contains('ql-header')) {
            fillSelect(select, HEADERS);
          } else if (select.classList.contains('ql-size')) {
            fillSelect(select, SIZES);
          }
        }
        return new Picker(select);
      }
    });
    let update = () => {
      this.pickers.forEach(function(picker) {
        picker.update();
      });
    };
    this.quill.on(Emitter.events.EDITOR_CHANGE, update);
  }
}

function extractVideoUrl(url) {
  let match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
              url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return (match[1] || 'https') + '://www.youtube.com/embed/' + match[2] + '?showinfo=0';
  }
  if (match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/)) {  // eslint-disable-line no-cond-assign
    return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
  }
  return url;
}

function fillSelect(select, values, defaultValue = false) {
  values.forEach(function(value) {
    let option = document.createElement('option');
    if (value === defaultValue) {
      option.setAttribute('selected', 'selected');
    } else {
      option.setAttribute('value', value);
    }
    select.appendChild(option);
  });
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
