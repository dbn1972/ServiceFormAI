/**
 * DocumentScanner — Client-side edge detection and perspective correction.
 *
 * Uses canvas-based Canny-style edge detection to find document boundaries,
 * then applies perspective correction to produce a clean rectangular image.
 * All computations use the <canvas> API — no server calls.
 */

import type { DetectedEdges, Point } from './types';

/**
 * Detect document edges in a video frame.
 *
 * Pipeline:
 * 1. Convert to grayscale
 * 2. Apply Gaussian blur (3×3)
 * 3. Compute gradient magnitude (Sobel)
 * 4. Threshold to binary edge map
 * 5. Find contours and identify the largest quadrilateral
 *
 * Returns the four corners of the detected quadrilateral, or null if
 * no document is found.
 */
export function detectDocumentEdges(imageData: ImageData): DetectedEdges {
  const { data, width, height } = imageData;

  if (width < 3 || height < 3) {
    return { corners: null, confidence: 0 };
  }

  // Step 1: Convert to grayscale
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Step 2: Gaussian blur (3×3 kernel)
  const blurred = gaussianBlur3x3(gray, width, height);

  // Step 3: Sobel gradient magnitude
  const gradient = sobelGradient(blurred, width, height);

  // Step 4: Threshold to binary edge map
  const threshold = computeOtsuThreshold(gradient, width, height);
  const edges = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    edges[i] = gradient[i] >= threshold ? 255 : 0;
  }

  // Step 5: Find the largest quadrilateral
  const contourPoints = findEdgePoints(edges, width, height);
  const quad = findLargestQuadrilateral(contourPoints, width, height);

  if (!quad) {
    return { corners: null, confidence: 0 };
  }

  // Compute confidence based on area ratio
  const quadArea = computeQuadArea(quad);
  const imageArea = width * height;
  const areaRatio = quadArea / imageArea;

  // Confidence is higher when the document fills a reasonable portion of the frame
  const confidence = Math.min(1, Math.max(0, areaRatio * 2));

  return { corners: quad, confidence };
}

/**
 * Apply perspective correction to extract a rectangular document image
 * from the detected quadrilateral corners.
 *
 * Uses bilinear interpolation to map the quadrilateral to a rectangle.
 */
export function applyPerspectiveCorrection(
  sourceCanvas: HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
  outputWidth: number,
  outputHeight: number,
): HTMLCanvasElement {
  const destCanvas = document.createElement('canvas');
  destCanvas.width = outputWidth;
  destCanvas.height = outputHeight;

  const sourceCtx = sourceCanvas.getContext('2d');
  const destCtx = destCanvas.getContext('2d');

  if (!sourceCtx || !destCtx) {
    return destCanvas;
  }

  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const destData = destCtx.createImageData(outputWidth, outputHeight);

  const [tl, tr, br, bl] = corners;

  // For each pixel in the destination, compute the corresponding source position
  // using bilinear interpolation of the quadrilateral corners
  for (let dy = 0; dy < outputHeight; dy++) {
    for (let dx = 0; dx < outputWidth; dx++) {
      const u = dx / (outputWidth - 1 || 1);
      const v = dy / (outputHeight - 1 || 1);

      // Bilinear interpolation of the four corners
      const sx =
        (1 - u) * (1 - v) * tl.x +
        u * (1 - v) * tr.x +
        u * v * br.x +
        (1 - u) * v * bl.x;
      const sy =
        (1 - u) * (1 - v) * tl.y +
        u * (1 - v) * tr.y +
        u * v * br.y +
        (1 - u) * v * bl.y;

      // Sample the source pixel (nearest neighbor for simplicity)
      const srcX = Math.round(sx);
      const srcY = Math.round(sy);

      if (srcX >= 0 && srcX < sourceCanvas.width && srcY >= 0 && srcY < sourceCanvas.height) {
        const srcIdx = (srcY * sourceCanvas.width + srcX) * 4;
        const destIdx = (dy * outputWidth + dx) * 4;
        destData.data[destIdx] = sourceData.data[srcIdx];
        destData.data[destIdx + 1] = sourceData.data[srcIdx + 1];
        destData.data[destIdx + 2] = sourceData.data[srcIdx + 2];
        destData.data[destIdx + 3] = sourceData.data[srcIdx + 3];
      }
    }
  }

  destCtx.putImageData(destData, 0, 0);
  return destCanvas;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Apply a 3×3 Gaussian blur kernel. */
function gaussianBlur3x3(gray: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(width * height);
  // Kernel: [1,2,1; 2,4,2; 1,2,1] / 16
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const val =
        (gray[idx - width - 1] +
          2 * gray[idx - width] +
          gray[idx - width + 1] +
          2 * gray[idx - 1] +
          4 * gray[idx] +
          2 * gray[idx + 1] +
          gray[idx + width - 1] +
          2 * gray[idx + width] +
          gray[idx + width + 1]) /
        16;
      result[idx] = Math.round(val);
    }
  }
  return result;
}

/** Compute Sobel gradient magnitude. */
function sobelGradient(gray: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel X kernel
      const gx =
        -gray[idx - width - 1] +
        gray[idx - width + 1] +
        -2 * gray[idx - 1] +
        2 * gray[idx + 1] +
        -gray[idx + width - 1] +
        gray[idx + width + 1];

      // Sobel Y kernel
      const gy =
        -gray[idx - width - 1] +
        -2 * gray[idx - width] +
        -gray[idx - width + 1] +
        gray[idx + width - 1] +
        2 * gray[idx + width] +
        gray[idx + width + 1];

      result[idx] = Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));
    }
  }

  return result;
}

/** Compute Otsu's threshold for binarization. */
function computeOtsuThreshold(gradient: Uint8Array, width: number, height: number): number {
  const histogram = new Array(256).fill(0);
  const total = width * height;

  for (let i = 0; i < total; i++) {
    histogram[gradient[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

/** Collect edge points from the binary edge map. */
function findEdgePoints(edges: Uint8Array, width: number, height: number): Point[] {
  const points: Point[] = [];
  // Sample edge points (skip every other pixel for performance)
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (edges[y * width + x] === 255) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

/**
 * Find the largest quadrilateral from edge points.
 *
 * Uses a simplified approach: find the convex hull of edge points,
 * then approximate it to a quadrilateral using the Douglas-Peucker algorithm.
 */
function findLargestQuadrilateral(
  points: Point[],
  width: number,
  height: number,
): [Point, Point, Point, Point] | null {
  if (points.length < 4) {
    return null;
  }

  // Compute convex hull
  const hull = convexHull(points);
  if (hull.length < 4) {
    return null;
  }

  // Approximate hull to a polygon with fewer vertices
  const perimeter = computePerimeter(hull);
  const epsilon = perimeter * 0.02;
  const approx = douglasPeucker(hull, epsilon);

  // If we got a quadrilateral, use it
  if (approx.length === 4) {
    return orderCorners(approx) as [Point, Point, Point, Point];
  }

  // If more than 4 points, find the 4 that form the largest quadrilateral
  if (approx.length > 4) {
    return findBestFourCorners(approx);
  }

  // If fewer than 4 points, try with a smaller epsilon
  if (hull.length >= 4) {
    return findBestFourCorners(hull);
  }

  return null;
}

/** Compute convex hull using Andrew's monotone chain algorithm. */
function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length <= 1) return sorted;

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half because it's repeated
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

/** Cross product of vectors OA and OB. */
function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/** Compute perimeter of a polygon. */
function computePerimeter(points: Point[]): number {
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    const dx = next.x - points[i].x;
    const dy = next.y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/** Douglas-Peucker polygon simplification. */
function douglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance from the line between first and last
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

/** Perpendicular distance from a point to a line segment. */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLenSq = dx * dx + dy * dy;

  if (lineLenSq === 0) {
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  return num / Math.sqrt(lineLenSq);
}

/** Order 4 corners as [topLeft, topRight, bottomRight, bottomLeft]. */
function orderCorners(points: Point[]): Point[] {
  // Sort by sum (x+y) to find TL and BR
  const sorted = [...points].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const tl = sorted[0];
  const br = sorted[3];

  // Sort by difference (y-x) to find TR and BL
  const sortedDiff = [...points].sort((a, b) => (a.y - a.x) - (b.y - b.x));
  const tr = sortedDiff[0];
  const bl = sortedDiff[3];

  return [tl, tr, br, bl];
}

/** Find the 4 points from a set that form the largest area quadrilateral. */
function findBestFourCorners(points: Point[]): [Point, Point, Point, Point] | null {
  if (points.length < 4) return null;

  // Use the extreme points (min/max x and y)
  let minX = points[0], maxX = points[0], minY = points[0], maxY = points[0];

  for (const p of points) {
    if (p.x < minX.x) minX = p;
    if (p.x > maxX.x) maxX = p;
    if (p.y < minY.y) minY = p;
    if (p.y > maxY.y) maxY = p;
  }

  // Deduplicate — if any extremes are the same point, pick alternatives
  const candidates = [minX, maxX, minY, maxY];
  const unique: Point[] = [];
  for (const c of candidates) {
    if (!unique.some(u => u.x === c.x && u.y === c.y)) {
      unique.push(c);
    }
  }

  // Fill remaining from other points
  for (const p of points) {
    if (unique.length >= 4) break;
    if (!unique.some(u => u.x === p.x && u.y === p.y)) {
      unique.push(p);
    }
  }

  if (unique.length < 4) return null;

  const ordered = orderCorners(unique.slice(0, 4));
  return ordered as [Point, Point, Point, Point];
}

/** Compute the area of a quadrilateral using the shoelace formula. */
function computeQuadArea(corners: [Point, Point, Point, Point]): number {
  const [a, b, c, d] = corners;
  return (
    Math.abs(
      a.x * b.y - b.x * a.y +
      b.x * c.y - c.x * b.y +
      c.x * d.y - d.x * c.y +
      d.x * a.y - a.x * d.y,
    ) / 2
  );
}
