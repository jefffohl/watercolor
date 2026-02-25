/**
 *  Art is a constant process of inventing ways to escape the restrictions of past inventions.
 *  Thanks to Tyler Hobbs: https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art
 */

// types
type Point = { x: number; y: number; variance: number };
type Polygon = Point[];

class WaterColorAnimator {
  private context: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private rect: DOMRect | undefined;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (this.canvas?.getContext) {
      const dpr = window.devicePixelRatio;
      this.rect = this.canvas.getBoundingClientRect();
      this.canvas.width = this.rect.width * dpr;
      this.canvas.height = this.rect.height * dpr;
      this.context = this.canvas.getContext("2d");
      this.context?.scale(dpr, dpr);
    }
  }

  private gaussianRandom(mean: number, sd: number) {
    const u1 = Math.random();
    const u2 = Math.random();

    // Box-Muller transform
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Scale to mean and standard deviation
    return z0 * sd + mean;
  }

  /**
   * Deform a polygon
   */
  private deformPolygon(polygon: Polygon, radius: number): Polygon {
    // It's pretty simple, and it goes something like this:
    // For each line A -> C in the polygon, find the midpoint, B. From a Gaussian distribution centered on B, pick a new point B'.
    // get B:
    const newPoly: Polygon = [];
    for (let i = 0; i < polygon.length; i++) {
      const pointA = polygon[i];
      if (!pointA) {
        continue;
      }
      const A = { x: pointA.x, y: pointA.y, variance: pointA.variance };
      const n: number = (i + 1) % polygon.length;
      const pointC = polygon[n];
      if (!pointC) {
        continue;
      }
      const C = { x: pointC.x, y: pointC.y, variance: pointC.variance };
      if (!A || !C) {
        continue;
      }
      const variance = this.gaussianRandom(
        (A.variance + C.variance) / 2,
        radius / 20,
      );
      const B = {
        x: this.gaussianRandom((A.x + C.x) / 2, variance),
        y: this.gaussianRandom((A.y + C.y) / 2, variance),
        variance,
      };
      newPoly.push(A, B, C);
    }
    return newPoly;
    // Update the polygon, replacing the line A -> C with two lines: A -> B' and B' -> C
    // If we haven't hit our max recursion depth, repeat from step 1, splitting the child lines.
    // Depending on the variation in your Gaussian distribution and the recursion depth, this will produce a polygon with jagged, detailed edges.
  }

  private createPolygon(
    coordinates: { x: number; y: number },
    radius: number,
    facets: number,
  ): Polygon {
    if (!coordinates || !radius || !facets) {
      return [];
    }
    // we have the coordinates of the center,
    // so, we need to create spokes out from there,
    // we can use the following forumulae to find the
    // x and y coordinates of the point of a circle with
    // radius r and center point h,k, and angle theta:
    // x = h + (r*cos(theta))
    // y = k + (r*sin(theta))
    const base_angle = (Math.PI * 2) / facets;

    const points: Point[] = [];

    for (let i = 0; i < facets; i++) {
      const angle = base_angle * i;
      if (angle < 0 || angle > Math.PI * 2) {
        continue;
      }
      let x = Math.round(coordinates.x + radius * Math.cos(angle));

      if (x < 0) x = 0; // if the coordinate goes off the edge, just keep it on the edge
      let y = Math.round(coordinates.y + radius * Math.sin(angle));

      let variance = Math.random() * (radius / 3);

      if (y < 0) y = 0;
      points.push({ x, y, variance });
    }

    return points;
  }

  private iterativelyDeformPolygon(
    polygon: Polygon,
    radius: number,
    iterations: number,
  ): Polygon {
    let deformedPolygon = polygon;
    for (let i = 0; i < iterations; i++) {
      deformedPolygon = this.deformPolygon(deformedPolygon, radius);
    }
    return deformedPolygon;
  }

  /**
   * Draw a polygon, from a given center coordinate,
   * and radius. Returns the polygon's coordinates
   */

  private drawPolygon(polygon: Polygon, color: string) {
    if (!this.canvas || !this.context || !polygon[0]) {
      return;
    }

    // Step 3: Draw the polygon
    this.context.beginPath(); // Start a new path
    this.context.moveTo(polygon[0].x, polygon[0].y); // Move to the first point

    // Loop through the remaining points and draw lines to them
    for (let i = 1; i < polygon.length; i++) {
      // with strict typescript rules, we need to assign the indexed value to a constant:
      const point = polygon[i];
      if (!point) {
        continue;
      }
      this.context.lineTo(point.x, point.y);
    }

    this.context.closePath(); // Connect the last point to the first
    this.context.fillStyle = color; // Set the fill color
    this.context.fill(); // Fill the interior
  }

  /**
   * Initializes the animation on the specified canvas
   */

  public start() {
    // create a random number of polygons:
    let radius = Math.round(Math.random() * 500);
    let facets = Math.round(Math.random() * 10);
    if (facets < 5) {
      facets = 5;
    }
    // get coordinates
    const x = Math.round(Math.random() * (this.rect!.width || 100));
    const y = Math.round(Math.random() * (this.rect!.height || 100));
    // calculate random color
    const r = Math.round(Math.random() * 256);
    const g = Math.round(Math.random() * 256);
    const b = Math.round(Math.random() * 256);
    const color = `rgba(${r},${g},${b},0.025)`;

    const poly = this.createPolygon({ x, y }, radius, facets);
    const deformedPoly = this.deformPolygon(poly, radius);
    const numberOfLayers = 85;
    let iteration = 0;
    let self = this;
    let timer: number;

    function draw() {
      iteration++;
      self.drawPolygon(
        self.iterativelyDeformPolygon(deformedPoly, radius, 5),
        color,
      );
      timer = setTimeout(() => {
        if (iteration <= numberOfLayers) {
          draw();
        } else {
          if (timer) {
            clearTimeout(timer);
          }
          self.start();
        }
      }, 10);
    }
    draw();
  }
}

const animator = new WaterColorAnimator("canvas");
animator.start();
