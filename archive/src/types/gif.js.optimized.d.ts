declare module 'gif.js.optimized' {
  // Type definitions for gif.js.optimized

  interface GIFOptions {
    workers?: number;
    workerScript?: string;
    quality?: number;
    background?: string;
    width?: number | null;
    height?: number | null;
    transparent?: string | null;
    dither?: boolean | string;
    repeat?: number; // 0 for infinity
    debug?: boolean;
  }

  interface FrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      image: CanvasImageSource | CanvasRenderingContext2D,
      options?: FrameOptions
    ): void;
    render(): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    abort(): void;
  }

  export = GIF;
}
