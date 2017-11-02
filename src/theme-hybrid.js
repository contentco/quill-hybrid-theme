import extend from 'extend';
import Emitter from 'quill/core/emitter';
import BaseTheme, { BaseTooltip } from 'quill/themes/base';
import LinkBlot from 'quill/formats/link';
import { Range } from 'quill/core/selection';

let ColorPicker = Quill.import('ui/color-picker');
let Picker = Quill.import('ui/picker');
let IconPicker = Quill.import('ui/icon-picker');
let icons = Quill.import('ui/icons');
let Delta = Quill.import('delta');
let Inline = Quill.import('blots/inline');

let Toolbar = Quill.import('modules/toolbar');

const ALIGNS = [ false, 'center', 'right', 'justify' ];

const COLORS = ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff','#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff','#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff','#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2','#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'];

const FONTS = [ false, 'serif', 'monospace' ];

const HEADERS = [ '1', '2', '3', false ];

const SIZES = [ 'small', false, 'large', 'huge' ];

const TOOLBAR_CONFIG = [['bold', 'italic', 'underline', 'link'],[{ list: 'ordered' }, { list: 'bullet' }],['clean'],['link']];

class HybridTheme extends BaseTheme {
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
    this.buildButtons([].slice.call(toolbar.container.querySelectorAll('button')), icons);
    this.buildPickers([].slice.call(toolbar.container.querySelectorAll('select')), icons);
    this.tooltip = new SnowTooltip(this.quill, this.options.bounds);

    if (toolbar.container.querySelector('.ql-link')) {
      this.quill.keyboard.addBinding({ key: 'K', shortKey: true }, function(range, context) {
        toolbar.handlers['link'].call(toolbar, !context.format.link);
      });
    }
    toolbar.addHandler('link', this.linkEventHanlder);
    toolbar.addHandler('video', this.videoEventHanlder);
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



class ContentTooltip {
  constructor(quill) {
    this.quill = quill;
    this.boundsContainer = this.quill.container || document.body;
    this.root = quill.addContainer('ql-bubble-actions');
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
        // Lock our width so we will expand beyond our offsetParent boundaries
        // this.root.style.left = '0px';
        // this.root.style.width = '';
        // this.root.style.width = this.root.offsetWidth + 'px';
        let lines = this.quill.getLines(range.index, range.length);
        if (lines.length === 1) {
          //this.position(this.quill.getBounds(range));
          this.position({bottom:this.quill.getBounds(range).bottom,
            height:this.quill.getBounds(range).height,
            left:this.quill.container.offsetWidth - this.quill.getBounds(range).width/2,
            right: this.root.offsetWidth,top:this.quill.getBounds(range).top - this.root.offsetHeight/2,width:this.quill.getBounds(range).width});
        }
        else {
        //   let lastLine = lines[lines.length - 1];
        //   let index = this.quill.getIndex(lastLine);
        //   let length = Math.min(lastLine.length() - 1, range.index + range.length - index);
        //   let bounds = this.quill.getBounds(new Range(index, length));
        //   this.position(bounds);
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
    let top = reference.top;
    this.root.style.right = '0px';
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
  '<input type="text" data-formula="e=mc^2" data-link="https://google.com" data-video="Embed URL">',
  '<a class="ql-action"></a>',
  '<a class="ql-remove"></a>'
].join('');

Quill.register('themes/hybrid', HybridTheme);


class BubbleActions extends Toolbar {
  constructor(quill, options) {
    super(quill, options);
    this.container.classList.add('ql-toolbar-hybrid');
    this.buildButtons([].slice.call(this.container.querySelectorAll('button')), icons);
    this.actionBtn = new ContentTooltip(this.quill, this.options.bounds);
    this.actionBtn.root.appendChild(this.container);

    var commentBtns = document.getElementsByClassName('ql-comment');
    if (commentBtns) {
      [].slice.call( commentBtns ).forEach(function ( commentBtn ) {
        commentBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16"><g fill="none" fill-rule="evenodd"><path fill="#444" fill-rule="nonzero" d="M9.92 11H13c1.66 0 3-1.36 3-3V5c0-1.66-1.34-3-3-3H5C3.34 2 2 3.34 2 5v3c0 1.64 1.34 3 3 3h1.44l.63 1.88 2.85-1.9zM5 0h8c2.76 0 5 2.24 5 5v3c0 2.75-2.24 5-5 5h-2.47L7.1 15.26c-.47.3-1.1.2-1.4-.27-.05-.1-.08-.18-.1-.26L5 13c-2.76 0-5-2.25-5-5V5c0-2.76 2.24-5 5-5z"/><path stroke="#444" stroke-width="2" d="M5.37 5H13M5.37 8H10" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
      });
    }
    this.addHandler('comment', this.commentEventHanlder);
  }

  commentEventHanlder() {
    let quill = this.quill;
    checkDialogExist(quill);
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
}

Quill.register('modules/bubble_actions', BubbleActions);

class CommentBlot extends Inline {
  static create(commentText) {
    const node = super.create();
    node.dataset.comment = commentText.comment;
    if (commentText.id) {
      node.dataset.id = commentText.id;
    }
    if (commentText.resolved) {
      node.dataset.resolved = commentText.resolved;
    }
    return node;
  }
  static formats(node) {
    return node.dataset;
  }
  format(name, value) {
    super.format(name, value);
  }
}

CommentBlot.blotName = 'comment';
CommentBlot.tagName = 'SPAN';
CommentBlot.className = 'annotation';

Quill.register({
  'formats/comment': CommentBlot
});


class GrammlyBlot extends Inline {
  static create() {
    const node = super.create();
    return node;
  }
  static formats(node) {
    return node.dataset;
  }
  format(name, value) {
    super.format(name, value);
  }
}

GrammlyBlot.blotName = 'grammer';
GrammlyBlot.tagName = 'SPAN';
GrammlyBlot.className = 'gr_';

Quill.register({
  'formats/grammer': GrammlyBlot
});


function checkDialogExist(quill){
  let commentToolTip = document.getElementById('inline-comment');
  let commentMask = document.getElementById('inline-comment-mask');
  if (commentToolTip) {
    commentToolTip.remove();
    commentMask.remove();
  }
  else{
    createCommentDialog(quill);
  }
}

function createCommentDialog(quill) {
  let range = quill.getSelection();
  let text = quill.getText(range.index, range.length);
  if (text.length < 1) {
    return;
  }
  const atSignBounds = quill.getBounds(range.index);
  let containerMask = document.createElement('div');
  containerMask.id='inline-comment-mask';
  containerMask.style.width   = '100%';
  containerMask.style.height   = '100%';
  containerMask.style.top   = '0px';
  containerMask.style.position   = 'fixed';
  containerMask.style.display   = 'block';

  let container  = document.createElement('div');
  container.id =  'inline-comment';
  container.classList.add('inline-comment');
  quill.container.appendChild(container);
  quill.container.appendChild(containerMask);
  container.style.position   = 'absolute';
  container.innerHTML = '<textarea class="commentText" placeholder="Type your comment"></textarea><div class="inline-comment-bottom"><span class="inline-cancel">Cancel</span> <span class="inline-send">Send</span> </div>';
  container.style.left = (atSignBounds.left - 250)+ 'px';

  if (atSignBounds.left + 250 < quill.container.clientWidth) {
    container.style.left = (atSignBounds.left)+ 'px';
  }

  container.style.top = 10 + atSignBounds.top + atSignBounds.height + 'px';
  container.style.zIndex = 80;
  document.querySelector('.commentText').focus();

  let inlineCancel = document.querySelector('.inline-cancel');
  let commentToolTip = document.querySelector('.inline-comment');

  inlineCancel.addEventListener('click',function(){
    commentToolTip.style.display    = 'none';
    containerMask.style.display     = 'none';
  });

  let inlineSend = document.querySelector('.inline-send');

  inlineSend.addEventListener('click',function(){
    const commentObj = {};
    let commentText = document.querySelector('.commentText').value;
    commentObj.comment = commentText;
    // if (typeof(commentId) !== 'undefined') {
    //   commentObj.id= commentId;
    // }
    // if (typeof(commentStatus) !== 'undefined') {
    //   commentObj.resolved= commentStatus;
    // }
    commentToolTip.remove();
    containerMask.remove();
    quill.format('comment', commentObj);
  });
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
