/**
 *  Art is a constant process of inventing ways to escape the restrictions of past inventions.
 */

// types

// constants
class WaterColorAnimator {
  private context: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (this.canvas?.getContext) {
      const dpr = window.devicePixelRatio;
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.context = this.canvas.getContext("2d");
      this.context?.scale(dpr, dpr);
    }
  }

  /**
   * Draw a polygon, from a given center coordinate,
   * and radius. Returns the polygon's coordinates
   */

  private drawPolygon(
    coordinates: { x: number; y: number },
    radius: number,
    facets: number,
    color: string,
  ) {
    if (
      !this.canvas ||
      !this.context ||
      !facets ||
      !radius ||
      !coordinates ||
      !color
    ) {
      return;
    }

    // we have the coordinates of the center,
    // so, we need to create spokes out from there,
    // we can use the following forumulae to find the
    // x and y coordinates of the point of a circle with
    // radius r and center point h,k, and angle theta:
    // x = h + (r*cos(theta))
    // y = k + (r*sin(theta))

    // get the angles
    const base_angle = (Math.PI * 2) / facets;

    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < facets; i++) {
      const angle = base_angle * i;
      if (angle < 0 || angle > 360) {
        continue;
      }
      let x = Math.round(coordinates.x + radius * Math.cos(angle));

      if (x < 0) x = 0; // if the coordinate goes off the edge, just keep it on the edge
      let y = Math.round(coordinates.y + radius * Math.sin(angle));

      if (y < 0) y = 0;
      points.push({ x, y });
    }

    if (!points[0]) {
      return;
    }

    // Step 3: Draw the polygon
    this.context.beginPath(); // Start a new path
    this.context.moveTo(points[0].x, points[0].y); // Move to the first point

    // Loop through the remaining points and draw lines to them
    for (let i = 1; i < points.length; i++) {
      // with strict typescript rules, we need to assign the indexed value to a constant:
      const point = points[i];
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

    const radius = Math.round(Math.random() * 500);
    let facets = Math.round(Math.random() * 50);
    if (facets < 5) {
      facets = 5;
    }
    // get coordinates
    const x = Math.round(Math.random() * (this.canvas?.width || 1));
    const y = Math.round(Math.random() * (this.canvas?.height || 1));
    // calculate random color
    const r = Math.round(Math.random() * 256);
    const g = Math.round(Math.random() * 256);
    const b = Math.round(Math.random() * 256);
    const color = `rgba(${r},${g},${b},0.85)`;
    setTimeout(() => {
      this.drawPolygon({ x, y }, radius, facets, color);
      this.start();
    }, 100);
  }
}

const animator = new WaterColorAnimator("canvas");
animator.start();
