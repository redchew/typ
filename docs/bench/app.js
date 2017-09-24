(function () {
  // typ.js
  // Fullstack type safety experiment
  // (c) Evan Wallace - github.com/evanw
  // (c) turbo        - github.com/turbo
  // MIT licensed

  "use strict";

  // Check for support
  if (!(typeof WebAssembly !== 'undefined' && WebAssembly && WebAssembly.instantiate)) {
    document.body.innerHTML = 'WebAssembly is required to view this page.';
    throw new Error("WebAssembly required.");
  }

    window.typ = {
      time: function() {
        return typeof performance !== 'undefined' && performance.now ? performance.now() : +new Date;
      },
      profilerTime: 0
    };

    window.typ.load = async function (adlib = {}) {
      /**
       * Reload stdlib into global context
       */
      window.typ.lib = {
        global: {
          ...adlib,

          /**
           * Stdlib
           */
          bytes: null,
          chars: [],
          ints: null,
          stdout: '',
          fs: {},

          reset: function () {
            window.typ.lib.global.stdout = '';
            window.typ.lib.global.fs = {};
          },

          createLengthPrefixedString: function (text) {
            var chars = window.typ.lib.global.chars,
              length = text.length,
              result = window.typ.exports.main_newString(length),
              ptr = result + 4 >> 1;
            for (var i = 0; i < length; i++) chars[ptr + i] = text.charCodeAt(i);
            return result;
          },

          extractLengthPrefixedString: function (index) {
            var chars = window.typ.lib.global.chars,
              text = '',
              length = window.typ.lib.global.ints[index >> 2],
              i = index + 4 >> 1;
            while (length-- > 0) text += String.fromCharCode(chars[i++]);
            return text;
          },

          assert: function (truth) {
            if (!truth) {
              throw new Error('Assertion failed');
            }
          },

          Terminal_setColor: function (color) {},

          Terminal_write: function (text) {
            window.typ.lib.global.stdout += window.typ.lib.global.extractLengthPrefixedString(text);
          },

          IO_readTextFile: function (path) {
            var contents = window.typ.lib.global.fs[window.typ.lib.global.extractLengthPrefixedString(path)];
            return typeof contents === 'string' ? window.typ.lib.global.createLengthPrefixedString(contents) : null;
          },

          IO_writeTextFile: function (path, contents) {
            window.typ.lib.global.fs[window.typ.lib.global.extractLengthPrefixedString(path)] = window.typ.lib.global.extractLengthPrefixedString(contents);
            return true;
          },

          IO_writeBinaryFile: function (path, contents) {
            var data = window.typ.lib.global.ints[contents >> 2];
            var length = window.typ.lib.global.ints[contents + 4 >> 2];
            window.typ.lib.global.fs[window.typ.lib.global.extractLengthPrefixedString(path)] = window.typ.lib.global.bytes.subarray(data, data + length);
            return true;
          },

          Profiler_begin: function () {
            window.typ.profilerTime = window.typ.time();
          },

          Profiler_end: function (text) {
            console.log(window.typ.lib.global.extractLengthPrefixedString(text) + ': ' + Math.round(window.typ.time() - window.typ.profilerTime) + 'ms');
          },
        }
      };

      const compSrc = await fetch('vendor/compiled.wasm');
      const compWasm = await compSrc.arrayBuffer();
      const compiledModule = await WebAssembly.compile(compWasm);
      const typCompiler = await WebAssembly.instantiate(compiledModule, window.typ.lib);

      window.typ.exports = typCompiler.exports;
      console.log(typCompiler);
      var memory = window.typ.exports.memory;
      window.typ.lib.global.exports = window.typ.exports;
      window.typ.lib.global.bytes = new Uint8Array(memory.buffer);
      window.typ.lib.global.chars = new Uint16Array(memory.buffer);
      window.typ.lib.global.ints = new Int32Array(memory.buffer);
    };

    window.typ.compile = function (sources, name) {
      var before = window.typ.time();

      window.typ.lib.global.reset();
      window.typ.exports.main_reset();

      sources.forEach(function (source) {
        window.typ.lib.global.fs[source.name] = source.contents;
        window.typ.exports.main_addArgument(window.typ.lib.global.createLengthPrefixedString(source.name));
      });

      window.typ.exports.main_addArgument(window.typ.lib.global.createLengthPrefixedString('--out'));
      window.typ.exports.main_addArgument(window.typ.lib.global.createLengthPrefixedString('.wasm'));

      const errCodes = [
        'ENONE',
        'EUSAGE',
        'EARGUMENTS',
        'EINPUT',
        'EOUTPUT',
        'ETARGET',
        'EREAD',
        'EWRITE',
      ];

      var returnCode = window.typ.exports.main_entry();
      var success = returnCode === 0;
      if (!success) {
        console.log(`Compile failed with code ${returnCode} (${errCodes[returnCode]}).`);
        throw new Error('Compile error');
      }
      var after = window.typ.time();
      var totalTime = Math.round(after - before);

      return {
        secondaryOutput: success && name + '.h' in window.typ.lib.global.fs ? window.typ.lib.global.fs[name + '.h'] : null,
        output: success ? window.typ.lib.global.fs[".wasm"] : null,
        totalTime: totalTime,
        stdout: window.typ.lib.global.stdout,
        returnCode: returnCode,
        success: success,
      };
    }
})();

(async function () {
  // Init typ compiler
  await window.typ.load();

  // Get source and elements
  const 
  width = 800,
  height = 400,
  unsupported = document.getElementById('unsupported'),
  wasmCanvas = document.getElementById('wasm-canvas'),
  wasmContext = wasmCanvas.getContext('2d'),
  jsCanvas = document.getElementById('js-canvas'),
  srcR = await fetch('benchmark.thin'),
  timeout = 10,
  limit = 100,
  sources = [{ name: '<stdin>', contents: await srcR.text() }];
  
  var count = 0;
  var jsTimes = [];
  var wasmTimes = [];

  draw(wasmContext, []);

  setTimeout(function tickWASM() {
    var before = window.typ.time();
    
    window.typ.compile(sources, 'compiled');
    
    var time = Math.round(window.typ.time() - before);
    wasmTimes.push(time);
    
    draw(wasmContext, wasmTimes);
    if (++count >= limit) return;
    setTimeout(tickWASM, timeout);
  }, timeout);


  function draw(context, times) {
    var scale = 1 / 1000;

    // Reset the canvas
    var ratio = window.devicePixelRatio || 1;
    var canvas = context.canvas;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    var plotWidth = width - 100;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    // Skip the first few times so we can measure the time after the JIT has warmed up
    var ignore = 2;

    // Compute the average
    var average = 0;
    var included = 0;
    for (var i = Math.min(ignore, times.length - 1); i < times.length; i++) {
      average += times[i];
      included++;
    }
    average /= included;

    // Draw the times
    var count = times.length;
    for (var i = 0; i < count; i++) {
      var x0 = (i + 0.2) * plotWidth / count;
      var x1 = (i + 0.8) * plotWidth / count;
      var y0 = height * (1 - times[i] * scale);
      var y1 = height;
      context.fillStyle = i < ignore ? '#777' : '#000';
      context.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    context.fillStyle = '#000';

    // Draw lines every 100ms
    context.globalAlpha = 0.25;
    for (var i = 100; i <= 0.999 / scale; i += 100) {
      var y = height * (1 - i * scale);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.globalAlpha = 1;

    // Draw average line
    var y = height * (1 - average * scale);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(plotWidth, y);
    context.stroke();

    // Draw average text
    context.textBaseline = 'middle';
    context.fillText('Average: ' + Math.round(average) + 'ms', plotWidth, y);
  }  
})();
