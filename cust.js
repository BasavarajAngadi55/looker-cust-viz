looker.plugins.visualizations.add({
  id: "kpi_donut_chart",
  label: "KPI Donut Chart",
  
  // Define options configurable in Looker's Edit panel
  options: {
    donutThickness: {
      type: "number",
      label: "Ring Thickness (px)",
      default: 35,
      section: "Style"
    },
    centerLabel: {
      type: "string",
      label: "Center Label Text",
      default: "TOTAL",
      section: "Style"
    }
  },

  // Initialize the DOM container
  create: function(element, config) {
    element.innerHTML = `
      <style>
        .kpi-donut-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Open Sans', Helvetica, Arial, sans-serif;
        }
        .kpi-donut-center {
          position: absolute;
          text-align: center;
          pointer-events: none;
        }
        .kpi-donut-label {
          font-size: 14px;
          color: #70778B;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .kpi-donut-value {
          font-size: 32px;
          color: #121826;
          font-weight: 800;
          margin-top: 4px;
        }
      </style>
      <div class="kpi-donut-wrapper">
        <div class="kpi-donut-center">
          <div class="kpi-donut-label" id="center-label">TOTAL</div>
          <div class="kpi-donut-value" id="center-value">0</div>
        </div>
        <div id="svg-container"></div>
      </div>
    `;
  },

  // Render method called whenever data or settings change
  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    // Data validation: Require at least 1 Dimension and 1 Measure
    if (!queryResponse || queryResponse.fields.dimensions.length < 1 || queryResponse.fields.measures.length < 1) {
      this.addError({
        title: "Missing Fields",
        message: "This chart requires 1 Dimension and 1 Measure."
      });
      return;
    }

    const dimField = queryResponse.fields.dimensions[0].name;
    const measureField = queryResponse.fields.measures[0].name;

    // 1. Calculate overall total for center KPI text
    const totalVal = data.reduce((acc, row) => acc + (Number(row[measureField].value) || 0), 0);
    
    // Format large numbers (e.g., 99880 -> 99.88k)
    const formatNumber = (num) => {
      if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
      return num.toLocaleString();
    };

    // Update middle text elements
    element.querySelector('#center-label').textContent = config.centerLabel || "TOTAL";
    element.querySelector('#center-value').textContent = formatNumber(totalVal);

    // 2. Render SVG Donut Slices
    const svgContainer = element.querySelector('#svg-container');
    svgContainer.innerHTML = '';

    const width = Math.min(element.clientWidth, element.clientHeight) || 300;
    const outerRadius = width / 2 - 10;
    const thickness = Math.min(config.donutThickness || 35, outerRadius - 20);
    const innerRadius = outerRadius - thickness;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", width);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${width / 2},${width / 2})`);
    svg.appendChild(g);

    // Color palette matching your image
    const palette = ['#7C4DFF', '#00ACC1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];

    let startAngle = 0;

    data.forEach((row, idx) => {
      const val = Number(row[measureField].value) || 0;
      if (val <= 0 || totalVal === 0) return;

      const sliceAngle = (val / totalVal) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      // Arc coordinate calculations
      const x1 = outerRadius * Math.sin(startAngle);
      const y1 = -outerRadius * Math.cos(startAngle);
      const x2 = outerRadius * Math.sin(endAngle);
      const y2 = -outerRadius * Math.cos(endAngle);

      const ix1 = innerRadius * Math.sin(endAngle);
      const iy1 = -innerRadius * Math.cos(endAngle);
      const ix2 = innerRadius * Math.sin(startAngle);
      const iy2 = -innerRadius * Math.cos(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z'
      ].join(' ');

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", palette[idx % palette.length]);

      // Native browser tooltips on hover
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${row[dimField].value}: ${row[measureField].rendered || val}`;
      path.appendChild(title);

      g.appendChild(path);
      startAngle = endAngle;
    });

    svgContainer.appendChild(svg);
    done();
  }
});
