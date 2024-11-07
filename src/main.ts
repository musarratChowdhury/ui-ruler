interface RulerOptions {
  unit?: string;
  tickMajor?: number;
  tickMinor?: number;
  tickMicro?: number;
  showLabel?: boolean;
  startX?: number;
  startY?: number;
  arrowStyle?: string;
  showMousePosition?: boolean;
  position?: "inside" | "outside";
  orientation?: "horizontal" | "vertical";
  rulerThickness?: number; // Set the height for horizontal or width for vertical
}

export default class Ruler {
  private options: RulerOptions;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private size: { width: number; height: number };
  private unitDiv: number = 1;
  private mouseX: number = 0;
  private mouseY: number = 0;

  private defaultOptions: RulerOptions = {
    unit: "px",
    tickMajor: 100,
    tickMinor: 20,
    tickMicro: 10,
    showLabel: true,
    startX: 0,
    startY: 0,
    arrowStyle: "line",
    showMousePosition: true,
    position: "outside", // Default position
    orientation: "horizontal", // Default orientation
    rulerThickness: 30, // Default thickness for the ruler
  };

  constructor(container: HTMLElement, options?: RulerOptions) {
    this.options = { ...this.defaultOptions, ...options };

    // Initialize the canvas element
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d")!;
    container.appendChild(this.canvas);

    // Set initial size based on orientation
    const thickness = this.options.rulerThickness!;
    if (this.options.orientation === "horizontal") {
      this.size = { width: container.clientWidth, height: thickness };
    } else {
      this.size = { width: thickness, height: container.clientHeight };
    }

    this.canvas.width = this.size.width;
    this.canvas.height = this.size.height;

    // Initialize the canvas drawing
    this.initCanvas();

    // Add mouse move event listener
    // this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    // this.canvas.addEventListener(
    //   "mouseleave",
    //   this.handleMouseLeave.bind(this)
    // );

    // Set canvas position based on `position` option
    this.setPosition(container);

    container.addEventListener("mousemove", this.handleMouseMove.bind(this));
    container.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
  }

  private initCanvas() {
    this.unitDiv = this.getPixelsPerUnit();
    this.renderRuler();
  }

  private getPixelsPerUnit(): number {
    switch (this.options.unit) {
      case "px":
        return 1;
      case "mm":
        return this.calcPixelsPerMM();
      case "cm":
        return this.calcPixelsPerMM() * 10;
      case "in":
        return this.calcPixelsPerMM() * 25.4;
      default:
        return 1;
    }
  }

  private calcPixelsPerMM(): number {
    const tempDiv = document.createElement("div");
    tempDiv.style.width = "1mm";
    document.body.appendChild(tempDiv);
    const pixelsPerMM = tempDiv.offsetWidth;
    document.body.removeChild(tempDiv);
    return pixelsPerMM;
  }

  private renderRuler() {
    const { tickMajor, tickMinor, tickMicro, showLabel, startX, startY } =
      this.options;

    this.ctx.clearRect(0, 0, this.size.width, this.size.height);

    if (this.options.orientation === "horizontal") {
      this.drawTicks(
        "horizontal",
        this.size.width,
        tickMajor!,
        tickMinor!,
        tickMicro!,
        startX!,
        showLabel!
      );
    } else {
      this.drawTicks(
        "vertical",
        this.size.height,
        tickMajor!,
        tickMinor!,
        tickMicro!,
        startY!,
        showLabel!
      );
    }

    if (this.options.showMousePosition) {
      this.drawMousePosition();
    }
  }

  private drawTicks(
    orientation: "horizontal" | "vertical",
    length: number,
    major: number,
    minor: number,
    micro: number,
    start: number,
    showLabel: boolean
  ) {
    this.ctx.beginPath();
    const tickPositions = [major, minor, micro];
    const tickHeights = [15, 10, 5];

    for (let i = start; i < length; i += this.unitDiv) {
      const tickTypeIndex = tickPositions.findIndex(
        (tick) => i % tick === 0 && tick > 0
      );
      if (tickTypeIndex === -1) continue;

      const tickHeight = tickHeights[tickTypeIndex];
      if (orientation === "horizontal") {
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, tickHeight);

        if (showLabel && tickTypeIndex === 0) {
          this.ctx.fillText(String(i), i + 2, tickHeight + 10);
        }
      } else {
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(tickHeight, i);

        if (showLabel && tickTypeIndex === 0) {
          this.ctx.fillText(String(i), tickHeight + 2, i + 10);
        }
      }
    }

    this.ctx.stroke();
  }

  private handleMouseMove(event: MouseEvent) {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;

    if (this.options.showMousePosition) {
      this.renderRuler();
    }
  }

  private handleMouseLeave() {
    this.mouseX = -1;
    this.mouseY = -1;
    this.renderRuler();
  }
  private setPosition(container: HTMLElement) {
    const thickness = this.options.rulerThickness!;
    if (this.options.position === "outside") {
      // For `outside`, position it based on orientation
      if (this.options.orientation === "horizontal") {
        this.canvas.style.position = "absolute";
        this.canvas.style.top = `${-thickness}px`;
      } else {
        this.canvas.style.position = "absolute";
        this.canvas.style.left = `${-thickness}px`;
      }
    } else {
      // For `inside`, the canvas is simply appended as before
      container.appendChild(this.canvas);
    }
  }

  private drawMousePosition() {
    if (this.mouseX < 0 || this.mouseY < 0) return;

    // Calculate the position in units based on orientation
    const positionInUnits =
      this.options.orientation === "horizontal"
        ? (this.mouseX / this.unitDiv).toFixed(0) // Only X for horizontal
        : (this.mouseY / this.unitDiv).toFixed(0); // Only Y for vertical

    // Start drawing position line
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    if (this.options.orientation === "horizontal") {
      this.ctx.moveTo(this.mouseX, 0);
      this.ctx.lineTo(this.mouseX, this.size.height);
    } else {
      this.ctx.moveTo(0, this.mouseY);
      this.ctx.lineTo(this.size.width, this.mouseY);
    }
    this.ctx.stroke();

    // Display the coordinate text
    this.ctx.fillStyle = "black";
    const positionText =
      this.options.orientation === "horizontal"
        ? `X: ${positionInUnits}${this.options.unit}` // Display only X
        : `Y: ${positionInUnits}${this.options.unit}`; // Display only Y

    // Adjust text position based on orientation
    if (this.options.orientation === "horizontal") {
      this.ctx.fillText(positionText, this.mouseX + 5, 15); // Position X label below
    } else {
      this.ctx.fillText(positionText, 5, this.mouseY + 10); // Position Y label to the side
    }
  }

  public refresh() {
    const thickness = this.options.rulerThickness!;
    if (this.options.orientation === "horizontal") {
      this.size.width = this.canvas.width =
        this.canvas.parentElement?.clientWidth || this.size.width;
      this.canvas.height = thickness;
    } else {
      this.size.height = this.canvas.height =
        this.canvas.parentElement?.clientHeight || this.size.height;
      this.canvas.width = thickness;
    }
    this.unitDiv = this.getPixelsPerUnit();
    this.renderRuler();
  }
}

////////////////TEst////////////////
const container = document.getElementById("testDiv") as HTMLElement;

// Options for the horizontal ruler
const horizontalOptions = {
  orientation: "horizontal" as const,
  rulerThickness: 30, // Set height of the horizontal ruler
  unit: "px",
  tickMajor: 50,
  tickMinor: 10,
  tickMicro: 5,
  showLabel: true,
  showMousePosition: true, // Set height of the horizontal ruler
};

// Create a horizontal ruler at the top of testDiv
const horizontalRuler = new Ruler(container, horizontalOptions);
horizontalRuler.refresh(); // Render the ruler to ensure the settings apply

// Options for the vertical ruler
const verticalOptions = {
  orientation: "vertical" as const,
  rulerThickness: 40, // Set width of the vertical ruler
  unit: "px",
  tickMajor: 50,
  tickMinor: 10,
  tickMicro: 5,
  showLabel: true,
  showMousePosition: true,
};

// Create a vertical ruler to the left of testDiv
const verticalRuler = new Ruler(container, verticalOptions);
verticalRuler.refresh(); // Render the ruler to ensure the settings apply
