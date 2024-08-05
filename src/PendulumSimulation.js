import React, { useRef, useEffect, useState } from 'react';
import './styles.css';

function PendulumSimulation() {
  const canvasRef = useRef(null);
  const [length, setLength] = useState(300);
  const [mass, setMass] = useState(20);
  const [airResistance, setAirResistance] = useState(true);
  const [freeBodyDiagram, setFreeBodyDiagram] = useState(false);
  const [values, setValues] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const originX = canvas.width / 2;
    const originY = 0; // Set origin at the top center

    class Pendulum {
      constructor(originX, originY, length, angle, colors, mass = 20) {
        this.originX = originX;
        this.originY = originY;
        this.length = length;
        this.angle = angle;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.damping = airResistance ? 0.995 : 1;
        this.gravity = 0.4;
        this.isDragging = false;
        this.colors = colors;
        this.colorIndex = 0;
        this.mass = mass;
      }

      update() {
        if (!this.isDragging) {
          this.angularAcceleration = (-this.gravity / this.length) * Math.sin(this.angle);
          this.angularVelocity += this.angularAcceleration;
          this.angularVelocity *= this.damping;
          this.angle += this.angularVelocity;
        }
      }

      draw() {
        const x = this.originX + this.length * Math.sin(this.angle);
        const y = this.originY + this.length * Math.cos(this.angle);

        ctx.beginPath();
        ctx.moveTo(this.originX, this.originY);
        ctx.lineTo(x, y);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(x - 10, y - 10, 5, x, y, this.mass);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, this.colors[this.colorIndex]);
        gradient.addColorStop(1, '#000');

        ctx.beginPath();
        ctx.arc(x, y, this.mass, 0, Math.PI * 2); // Use this.mass for bob size
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
      }

      setAngleFromMouse(mouseX, mouseY) {
        const dx = mouseX - this.originX;
        const dy = mouseY - this.originY;
        this.angle = Math.atan2(dy, dx);
        this.angularVelocity = 0;
      }

      isMouseOnBob(mouseX, mouseY) {
        const x = this.originX + this.length * Math.sin(this.angle);
        const y = this.originY + this.length * Math.cos(this.angle);
        const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
        return distance < this.mass;
      }

      changeColor() {
        this.colorIndex = (this.colorIndex + 1) % this.colors.length;
      }

      setLength(length) {
        this.length = length;
      }

      setMass(mass) {
        this.mass = mass;
      }

      getEnergy() {
        const height = this.length * (1 - Math.cos(this.angle));
        const potentialEnergy = this.mass * this.gravity * height;
        const kineticEnergy = 0.5 * this.mass * Math.pow(this.angularVelocity * this.length, 2);
        return {
          potential: potentialEnergy,
          kinetic: kineticEnergy,
          total: potentialEnergy + kineticEnergy,
        };
      }
    }

    const pendulum1 = new Pendulum(originX, originY, length, Math.PI / 4, ['blue', 'red'], mass);
    const pendulum2 = new Pendulum(originX, originY, length, Math.PI / 6, ['yellow', 'red'], mass);
    let draggingPendulum = null;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pendulum1.update();
      pendulum1.draw();
      pendulum2.update();
      pendulum2.draw();
      drawEnergyGraph();
      requestAnimationFrame(animate);
    }

    function drawEnergyGraph() {
      const energy1 = pendulum1.getEnergy();
      const energy2 = pendulum2.getEnergy();
      const energy = {
        potential: energy1.potential + energy2.potential,
        kinetic: energy1.kinetic + energy2.kinetic,
        total: energy1.total + energy2.total,
      };

      const energyCanvas = document.getElementById('energyCanvas');
      const energyCtx = energyCanvas.getContext('2d');
      const maxEnergy = 5000; // Adjust as needed

      energyCtx.clearRect(0, 0, energyCanvas.width, energyCanvas.height);

      energyCtx.fillStyle = 'blue';
      energyCtx.fillRect(10, energyCanvas.height - energy.potential / maxEnergy * energyCanvas.height, 50, energy.potential / maxEnergy * energyCanvas.height);

      energyCtx.fillStyle = 'red';
      energyCtx.fillRect(70, energyCanvas.height - energy.kinetic / maxEnergy * energyCanvas.height, 50, energy.kinetic / maxEnergy * energyCanvas.height);

      energyCtx.fillStyle = 'green';
      energyCtx.fillRect(130, energyCanvas.height - energy.total / maxEnergy * energyCanvas.height, 50, energy.total / maxEnergy * energyCanvas.height);
    }

    const handleMouseDown = (event) => {
      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;

      if (pendulum1.isMouseOnBob(mouseX, mouseY)) {
        draggingPendulum = pendulum1;
        pendulum1.isDragging = true;
        pendulum1.changeColor();
      } else if (pendulum2.isMouseOnBob(mouseX, mouseY)) {
        draggingPendulum = pendulum2;
        pendulum2.isDragging = true;
        pendulum2.changeColor();
      }
    };

    const handleMouseMove = (event) => {
      if (draggingPendulum) {
        const mouseX = event.clientX - canvas.getBoundingClientRect().left;
        const mouseY = event.clientY - canvas.getBoundingClientRect().top;
        draggingPendulum.setAngleFromMouse(mouseX, mouseY);
      }
    };

    const handleMouseUp = () => {
      if (draggingPendulum) {
        draggingPendulum.isDragging = false;
        draggingPendulum = null;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    animate();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [length, mass, airResistance]);

  return (
    <div className="container">
      <div className="left-panel">
        <canvas id="energyCanvas" width="200" height="300"></canvas> {/* Adjusted height */}
      </div>
      <canvas ref={canvasRef} width={window.innerWidth - 500} height={window.innerHeight}></canvas>
      <div className="right-panel">
        <div className="controls-box">
          <h2>Controls</h2>
          <div>
            <label htmlFor="lengthRange">Length:</label>
            <input
              type="range"
              id="lengthRange"
              min="100"
              max="500"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="massRange">Mass:</label>
            <input
              type="range"
              id="massRange"
              min="10"
              max="50"
              value={mass}
              onChange={(e) => setMass(parseInt(e.target.value))}
            />
          </div>
        </div>
        <div className="options-box">
          <h3>Options</h3>
          <label>
            <input
              type="checkbox"
              checked={airResistance}
              onChange={(e) => setAirResistance(e.target.checked)}
            />
            Air Resistance
          </label>
          <label>
            <input
              type="checkbox"
              checked={freeBodyDiagram}
              onChange={(e) => setFreeBodyDiagram(e.target.checked)}
            />
            Freebody Diagram
          </label>
          <label>
            <input
              type="checkbox"
              checked={values}
              onChange={(e) => setValues(e.target.checked)}
            />
            Values
          </label>
        </div>
      </div>
    </div>
  );
}

export default PendulumSimulation;
