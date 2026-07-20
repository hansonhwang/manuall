/**
 * pdfjs-dist(=pdf-parse의 내부 의존성)는 Node.js 환경에서 `@napi-rs/canvas`가
 * 정상적으로 로드되면 그 패키지의 DOMMatrix/ImageData를 전역에 폴리필한다.
 * 하지만 서버리스 배포(Vercel 등)에서는 네이티브 바이너리가 런타임에
 * 로드되지 않는 경우가 있고, 그 경우 pdfjs-dist 모듈이 최상위 스코프에서
 * `new DOMMatrix()`를 실행하다가 "DOMMatrix is not defined"로 그냥 죽는다.
 * 우리는 텍스트 추출(getText)만 쓰고 실제 캔버스 렌더링은 하지 않으므로,
 * 스펙을 만족하는 최소한의 2D 어파인 행렬 폴리필만 있으면 충분하다.
 */
class DOMMatrixPolyfill {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: number[]) {
    if (Array.isArray(init)) {
      if (init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      } else if (init.length === 16) {
        // 4x4 행렬에서 2D 변환에 해당하는 성분만 취한다.
        this.a = init[0];
        this.b = init[1];
        this.c = init[4];
        this.d = init[5];
        this.e = init[12];
        this.f = init[13];
      }
    }
  }

  get m11() {
    return this.a;
  }
  get m12() {
    return this.b;
  }
  get m21() {
    return this.c;
  }
  get m22() {
    return this.d;
  }
  get m41() {
    return this.e;
  }
  get m42() {
    return this.f;
  }

  multiplySelf(other: DOMMatrixPolyfill): this {
    const { a, b, c, d, e, f } = this;
    this.a = a * other.a + c * other.b;
    this.b = b * other.a + d * other.b;
    this.c = a * other.c + c * other.d;
    this.d = b * other.c + d * other.d;
    this.e = a * other.e + c * other.f + e;
    this.f = b * other.e + d * other.f + f;
    return this;
  }

  preMultiplySelf(other: DOMMatrixPolyfill): this {
    const result = other.multiply(this);
    this.a = result.a;
    this.b = result.b;
    this.c = result.c;
    this.d = result.d;
    this.e = result.e;
    this.f = result.f;
    return this;
  }

  multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f]).multiplySelf(other);
  }

  translateSelf(x: number, y = 0): this {
    return this.multiplySelf(new DOMMatrixPolyfill([1, 0, 0, 1, x, y]));
  }

  translate(x: number, y = 0): DOMMatrixPolyfill {
    return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, x, y]));
  }

  scaleSelf(x: number, y = x): this {
    return this.multiplySelf(new DOMMatrixPolyfill([x, 0, 0, y, 0, 0]));
  }

  scale(x: number, y = x): DOMMatrixPolyfill {
    return this.multiply(new DOMMatrixPolyfill([x, 0, 0, y, 0, 0]));
  }

  invertSelf(): this {
    const { a, b, c, d, e, f } = this;
    const det = a * d - b * c;
    if (!det) {
      this.a = this.b = this.c = this.d = this.e = this.f = NaN;
      return this;
    }
    this.a = d / det;
    this.b = -b / det;
    this.c = -c / det;
    this.d = a / det;
    this.e = (c * f - d * e) / det;
    this.f = (b * e - a * f) / det;
    return this;
  }

  invert(): DOMMatrixPolyfill {
    return new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f]).invertSelf();
  }
}

class ImageDataPolyfill {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (typeof dataOrWidth === "number") {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = dataOrWidth;
      this.width = widthOrHeight;
      this.height = height ?? 0;
    }
  }
}

let installed = false;

export function ensurePdfjsNodePolyfills() {
  if (installed) return;
  installed = true;

  const g = globalThis as typeof globalThis & { DOMMatrix?: unknown; ImageData?: unknown };
  if (!g.DOMMatrix) {
    g.DOMMatrix = DOMMatrixPolyfill as unknown as typeof DOMMatrix;
  }
  if (!g.ImageData) {
    g.ImageData = ImageDataPolyfill as unknown as typeof ImageData;
  }
}
