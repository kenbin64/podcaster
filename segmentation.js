'use strict';
// On-device person segmentation using MediaPipe Selfie Segmentation, fully local (the model lives
// in vendor/selfie/). It turns the live video into a person-only canvas with a transparent
// background, so the studio can drop you in front of any backdrop or uploaded image while keeping
// you in the foreground. No server, no upload; the frames never leave the machine.
(function (global) {
  class Segmenter {
    constructor() {
      this.ready = false;
      this.hasFrame = false;
      this.person = document.createElement('canvas');   // RGBA: person opaque, background transparent
      this._busy = false;
    }
    async init(basePath) {
      if (!global.SelfieSegmentation) throw new Error('SelfieSegmentation script not loaded');
      const seg = new global.SelfieSegmentation({ locateFile: (f) => basePath + f });
      seg.setOptions({ modelSelection: 0, selfieMode: false });   // 0 = general 256x256 mask (sharper for a head-and-shoulders shot)
      seg.onResults((r) => this._onResults(r));
      await seg.initialize();
      this.seg = seg;
      this.ready = true;
    }
    _onResults(r) {
      const w = (r.image && r.image.width) || 0, h = (r.image && r.image.height) || 0;
      if (!w || !h) return;
      const p = this.person;
      if (p.width !== w || p.height !== h) { p.width = w; p.height = h; }
      const c = p.getContext('2d');
      c.save();
      c.clearRect(0, 0, w, h);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      // Feather the low-res mask edge so the cut-out border is soft, not blocky/pixelated.
      c.filter = 'blur(' + Math.max(2, Math.round(w / 360)) + 'px)';
      c.drawImage(r.segmentationMask, 0, 0, w, h);     // white = person (softened)
      c.filter = 'none';
      c.globalCompositeOperation = 'source-in';        // keep the frame only where the mask is white
      c.drawImage(r.image, 0, 0, w, h);
      c.restore();
      this.hasFrame = true;
    }
    // Call each animation frame; the in-flight guard naturally throttles to the model's own rate
    // while rendering stays smooth (the render reads the latest person canvas).
    pump(video) {
      if (!this.ready || !this.seg || this._busy) return;
      if (!video || video.readyState < 2) return;
      this._busy = true;
      this.seg.send({ image: video }).catch(() => {}).finally(() => { this._busy = false; });
    }
  }
  global.Segmenter = Segmenter;
})(window);
