/**
 *  Art is a constant process of inventing ways to escape the restrictions of past inventions.
 */

// types

type Polygon = { x: number; y: number }[];

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

  private gaussianRandom(mean: number, stdDev: number) {
    const u1 = Math.random();
    const u2 = Math.random();

    // Box-Muller transform
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Scale to mean and standard deviation
    return z0 * stdDev + mean;
  }

  /**
   * Deform a polygon
   */
  private deformPolygon(polygon: Polygon, deviation: number): Polygon {
    // It's pretty simple, and it goes something like this:
    // For each line A -> C in the polygon, find the midpoint, B. From a Gaussian distribution centered on B, pick a new point B'.
    // get B:
    const newPoly: Polygon = [];
    for (let i = 0; i < polygon.length; i++) {
      const pointA = polygon[i];
      if (!pointA) {
        continue;
      }
      const A = { x: pointA.x, y: pointA.y };
      const n: number = (i + 1) % polygon.length;
      const pointC = polygon[n];
      if (!pointC) {
        continue;
      }
      const C = { x: pointC.x, y: pointC.y };
      if (!A || !C) {
        continue;
      }
      const B = {
        x: this.gaussianRandom((A.x + C.x) / 2, deviation),
        y: this.gaussianRandom((A.y + C.y) / 2, deviation),
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

    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < facets; i++) {
      const angle = base_angle * i;
      if (angle < 0 || angle > Math.PI * 2) {
        continue;
      }
      let x = Math.round(coordinates.x + radius * Math.cos(angle));

      if (x < 0) x = 0; // if the coordinate goes off the edge, just keep it on the edge
      let y = Math.round(coordinates.y + radius * Math.sin(angle));

      if (y < 0) y = 0;
      points.push({ x, y });
    }

    return points;
  }

  private iterativelyDeformPolygon(
    polygon: Polygon,
    deviation: number,
    iterations: number,
  ): Polygon {
    let deformedPolygon = polygon;
    for (let i = 0; i < iterations; i++) {
      deformedPolygon = this.deformPolygon(deformedPolygon, deviation);
    }
    return deformedPolygon;
  }

  private createLayer(
    polygon: Polygon,
    layers: number,
    deviation: number,
  ): Polygon[] {
    const layer: Polygon[] = [];
    let poly = polygon;
    for (let i = 0; i < layers; i++) {
      poly = this.deformPolygon(poly, deviation);
      layer.push(poly);
    }
    return layer;
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
    let facets = Math.round(Math.random() * 50);
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
    const color = `rgba(${r},${g},${b},0.05)`;

    const poly = this.createPolygon({ x, y }, radius, facets);
    const deformedPoly = this.deformPolygon(poly, 4);
    const numberOfLayers = 50;
    let iteration = 0;
    let self = this;
    let timer: number;

    function draw() {
      iteration++;
      self.drawPolygon(
        self.iterativelyDeformPolygon(deformedPoly, radius / 10, 4),
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
      }, 5);
    }
    draw();
  }
}

const animator = new WaterColorAnimator("canvas");
animator.start();
