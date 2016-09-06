'use strict';

Editor.Panel.extend({
  style: `
    :host {
      margin: 5px;
    }

    canvas {
      border: 1px solid black;
      width: 300px;
      height: 300px;
      margin-bottom: 5px;
    }

    #text {
      text-align: left;
      margin-bottom: 20px;
    }

    .preview {
      position: relative;
      align-self: stretch;
    }

    .preview-box {
      position: absolute;
      left: 0px;
      background: #ccc;
      width: 20px;
      height: 20px;
    }

    .preview-box.left {
      left: 100%;
    }
  `,

  template: `
    <div class="fit layout vertical center">
      <h2>Curve Editor</h2>
      <canvas id="canvas"></canvas>
      <div id="text"></div>
      <ui-button id="btn">Preview</ui-button>

      <div class="preview">
        <div class="preview-box"></div>
      </div>
    </div>
  `,

  $: {
    canvas: '#canvas',
    text: '#text',
    btn: '#btn',
    previewBox: '.preview-box',
  },

  ready () {
    this.$canvas.width = 300;
    this.$canvas.height = 300;
    this._ctx = this.$canvas.getContext('2d');
    this._ctx.imageSmoothingEnabled = false;

    this._points = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0.1 },
      { x: 0.5, y: 0.9 },
      { x: 1, y: 1 },
    ];

    this.$btn.addEventListener('confirm', event => {
      let c2 = this._points[1];
      let c3 = this._points[2];
      if ( this.$previewBox.style.left === '0px' ) {
        this.$previewBox.style.left = `${this.getBoundingClientRect().width - 20}px`;
      } else {
        this.$previewBox.style.left = '0px';
      }
      this.$previewBox.style.transition = `left 500ms cubic-bezier(${c2.x}, ${c2.y}, ${c3.x}, ${c3.y})`;
    });

    this.$canvas.addEventListener('mousedown', event => {
      if ( event.which !== 1 ) {
        return;
      }

      let bcr = event.target.getBoundingClientRect();
      let offsetX = event.clientX - bcr.left;
      let offsetY = event.clientY - bcr.top;

      let w = bcr.width;
      let h = bcr.height;

      let idx = this._getPoint( w, h, offsetX, offsetY );

      if ( idx !== -1 ) {
        Editor.UI.startDrag('default', event, event => {
          let offsetX = event.clientX - bcr.left;
          let offsetY = event.clientY - bcr.top;

          this._points[idx] = {
            x: offsetX/w,
            y: (h - offsetY)/h,
          };

          this._repaint();
        }, () => {
        });
      }
    });

    this._repaint();
  },

  _getPoint ( w, h, x, y ) {
    let c2 = this._points[1];
    let cx2 = c2.x * w;
    let cy2 = h - c2.y * h;

    let dx = cx2 - x;
    let dy = cy2 - y;

    if ( dx * dx + dy * dy <= 4 * 4 ) {
      return 1;
    }

    let c3 = this._points[2];
    let cx3 = c3.x * w;
    let cy3 = h - c3.y * h;

    dx = cx3 - x;
    dy = cy3 - y;

    if ( dx * dx + dy * dy <= 4 * 4 ) {
      return 2;
    }

    return -1;
  },

  _repaint () {
    let canvas = this.$canvas;
    let ctx = this._ctx;

    let c1 = this._points[0];
    let c2 = this._points[1];
    let c3 = this._points[2];
    let c4 = this._points[3];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this._drawGrid( ctx, canvas.width, canvas.height, 10 );
    this._drawBezier( ctx, canvas.width, canvas.height, c1, c2, c3, c4 );

    this.$text.innerText = `
      c1: [${Editor.Utils.toFixed(c1.x,2)}, ${Editor.Utils.toFixed(c1.y,2)}]
      c2: [${Editor.Utils.toFixed(c2.x,2)}, ${Editor.Utils.toFixed(c2.y,2)}]
      c3: [${Editor.Utils.toFixed(c3.x,2)}, ${Editor.Utils.toFixed(c3.y,2)}]
      c4: [${Editor.Utils.toFixed(c4.x,2)}, ${Editor.Utils.toFixed(c4.y,2)}]
    `;
  },

  _drawGrid ( ctx, w, h, step ) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#555';

    for ( let x = step; x < w; x += step ) {
      ctx.moveTo( x + 0.5, 0.5 );
      ctx.lineTo( x + 0.5, h + 0.5 );
    }

    for ( let y = step; y < h; y += step ) {
      ctx.moveTo( 0.5, y + 0.5 );
      ctx.lineTo( w + 0.5, y + 0.5 );
    }

    ctx.stroke();
  },

  _drawBezier ( ctx, w, h, c1, c2, c3, c4 ) {
    let cx1 = c1.x * w;
    let cy1 = h - c1.y * h;

    let cx2 = c2.x * w;
    let cy2 = h - c2.y * h;

    let cx3 = c3.x * w;
    let cy3 = h - c3.y * h;

    let cx4 = c4.x * w;
    let cy4 = h - c4.y * h;

    ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ff0';

      ctx.moveTo( cx1, cy1 );
      ctx.bezierCurveTo( cx2, cy2, cx3, cy3, cx4, cy4 );
    ctx.stroke();

    ctx.beginPath();
      ctx.strokeStyle = '#f00';

      ctx.moveTo( cx1, cy1 );
      ctx.lineTo( cx2, cy2 );
    ctx.stroke();

    ctx.beginPath();
      ctx.strokeStyle = '#f00';

      ctx.moveTo( cx3, cy3 );
      ctx.lineTo( cx4, cy4 );
    ctx.stroke();

    // ctx.beginPath();
    //   ctx.strokeStyle = '#fff';
    //   ctx.arc( cx1, cy1, 2, 0, Math.PI*2, true );
    // ctx.stroke();

    ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.arc( cx2, cy2, 4, 0, Math.PI*2, true );
    ctx.stroke();

    ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.arc( cx3, cy3, 4, 0, Math.PI*2, true );
    ctx.stroke();

    // ctx.beginPath();
    //   ctx.strokeStyle = '#fff';
    //   ctx.arc( cx4, cy4, 2, 0, Math.PI*2, true );
    // ctx.stroke();
  }
});
