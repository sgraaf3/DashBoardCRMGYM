class GraphingComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID '${containerId}' not found.`);
            return;
        }
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", "100%");
        this.svg.setAttribute("height", "300px");
        this.svg.setAttribute("viewBox", "0 0 500 300");
        this.container.innerHTML = ''; // Clear container
        this.container.appendChild(this.svg);

        this.margin = { top: 20, right: 20, bottom: 40, left: 50 };
        this.width = 500 - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;

        this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.g.setAttribute("transform", `translate(${this.margin.left},${this.margin.top})`);
        this.svg.appendChild(this.g);
    }

    render(data, options = {}) {
        while (this.g.firstChild) { this.g.removeChild(this.g.firstChild); }

        if (!data || data.length === 0) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", this.width / 2);
            text.setAttribute("y", this.height / 2);
            text.setAttribute("text-anchor", "middle");
            text.textContent = "No data to display";
            this.g.appendChild(text);
            return;
        }

        const xMax = Math.max(...data.map(d => d.x));
        const yMax = Math.max(...data.map(d => d.y));
        const xMin = Math.min(...data.map(d => d.x));
        const yMin = Math.min(...data.map(d => d.y));

        const xScale = (value) => (xMax - xMin === 0) ? this.width / 2 : (value - xMin) / (xMax - xMin) * this.width;
        const yScale = (value) => (yMax - yMin === 0) ? this.height / 2 : this.height - (value - yMin) / (yMax - yMin) * this.height;

        this._drawAxes(xScale, yScale, options, data);

        const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.x)},${yScale(d.y)}`).join(' ');
        linePath.setAttribute("d", pathData);
        linePath.setAttribute("fill", "none");
        linePath.setAttribute("stroke", options.lineColor || "steelblue");
        linePath.setAttribute("stroke-width", options.strokeWidth || 2);
        this.g.appendChild(linePath);

        data.forEach(d => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", xScale(d.x));
            circle.setAttribute("cy", yScale(d.y));
            circle.setAttribute("r", options.pointRadius || 4);
            circle.setAttribute("fill", options.pointColor || "steelblue");
            this.g.appendChild(circle);
        });
    }

    _drawAxes(xScale, yScale, options, data) {
        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", 0); xAxis.setAttribute("y1", this.height);
        xAxis.setAttribute("x2", this.width); xAxis.setAttribute("y2", this.height);
        xAxis.setAttribute("stroke", "#ccc");
        this.g.appendChild(xAxis);

        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", 0); yAxis.setAttribute("y1", 0);
        yAxis.setAttribute("x2", 0); yAxis.setAttribute("y2", this.height);
        yAxis.setAttribute("stroke", "#ccc");
        this.g.appendChild(yAxis);

        // Y-Axis Labels
        const yMin = Math.min(...data.map(d => d.y));
        const yMax = Math.max(...data.map(d => d.y));
        for (let i = 0; i <= 4; i++) {
            const value = yMin + (yMax - yMin) * (i / 4);
            const y = yScale(value);
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", -5); label.setAttribute("y", y);
            label.setAttribute("text-anchor", "end"); label.setAttribute("alignment-baseline", "middle");
            label.textContent = value.toFixed(0);
            this.g.appendChild(label);
        }

        // X-Axis Labels (using original date labels)
        data.forEach((d, i) => {
            if (i === 0 || i === data.length - 1 || Math.floor(data.length / 2) === i) { // First, middle, last
                const x = xScale(d.x);
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", x); label.setAttribute("y", this.height + 20);
                label.setAttribute("text-anchor", "middle");
                label.textContent = d.label;
                this.g.appendChild(label);
            }
        });
    }
}

export default GraphingComponent;