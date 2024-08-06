import React, { useRef, useEffect, useState } from 'react';
import './styles.css';

function PendulumSimulation() {
  const canvasRef = useRef(null);
  const [length, setLength] = useState(300);
  const [mass, setMass] = useState(20);
  const [airResistance, setAirResistance] = useState(true);
  const [freeBodyDiagram, setFreeBodyDiagram] = useState(false);
  const [values, setValues] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swingSpeed, setSwingSpeed] = useState(1);
  const [pendulum1Active, setPendulum1Active] = useState(true);
  const [pendulum2Active, setPendulum2Active] = useState(true);

  const pendulum1Ref = useRef(null);
  const pendulum2Ref = useRef(null);

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
        this.initialAngle = angle; // Store initial angle for reset
      }

      update() {
        if (!this.isDragging && isAnimating) {
          this.angularAcceleration = (-this.gravity / this.length) * Math.sin(this.angle);
          this.angularVelocity += this.angularAcceleration * swingSpeed;
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
        // Calculate the angle of the line between the origin and the mouse position
        const dx = mouseX - this.originX;
        const dy = mouseY - this.originY;
        const newAngle = Math.atan2(dy, dx);
      
        // Update the angle of the pendulum bob to follow the mouse direction
        this.angle = Math.PI / 2 - newAngle; // Adjust for correct alignment
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

      reset() {
        this.angle = this.initialAngle; // Reset to initial angle
        this.angularVelocity = 0;
        this.damping = airResistance ? 0.995 : 1;
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

    const pendulum1 = new Pendulum(originX, originY, length, 0, ['blue', 'red'], mass);
    const pendulum2 = new Pendulum(originX, originY, length, 0, ['yellow', 'red'], mass);

    pendulum1Ref.current = pendulum1;
    pendulum2Ref.current = pendulum2;

    let draggingPendulum = null;

    function animate() {
      if (!isAnimating) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawHalfMoonScale(); // Draw the half-moon scale
      if (pendulum1Active) {
        pendulum1Ref.current.update();
        pendulum1Ref.current.draw();
      }
      if (pendulum2Active) {
        pendulum2Ref.current.update();
        pendulum2Ref.current.draw();
      }
      drawEnergyGraph();
      requestAnimationFrame(animate);
    }

    function drawHalfMoonScale() {
      const radius = 100; // Radius of the half-moon scale
      const centerX = originX ;
     // Position the center of the scale at the radius height
      const originYCir = 5;

      ctx.beginPath();
      ctx.arc(centerX, originYCir, radius, Math.PI, 0, true); // Draw half-moon
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw the scale markings and labels
      for (let i = 0; i <= 180; i += 10) {
        const angle = (i * Math.PI) / 180;
        const xStart = centerX + radius * Math.cos(angle);
        const yStart = originYCir + radius * Math.sin(angle);
        const xEnd = centerX + (radius - 10) * Math.cos(angle);
        const yEnd = originYCir + (radius - 10) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();

        // Draw the labels
        if (i % 30 === 0) {
          ctx.font = '12px Arial';
          ctx.fillStyle = 'black';
          const labelX = centerX + (radius - 20) * Math.cos(angle);
          const labelY = originYCir + (radius - 20) * Math.sin(angle);
          ctx.fillText(i.toString(), labelX - 5, labelY + 5);
        }
      }
    }

    function drawEnergyGraph() {
      const energy1 = pendulum1Active ? pendulum1Ref.current.getEnergy() : { potential: 0, kinetic: 0, total: 0 };
      const energy2 = pendulum2Active ? pendulum2Ref.current.getEnergy() : { potential: 0, kinetic: 0, total: 0 };
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

      if (pendulum1Active && pendulum1Ref.current.isMouseOnBob(mouseX, mouseY)) {
        draggingPendulum = pendulum1Ref.current;
        draggingPendulum.isDragging = true;
      } else if (pendulum2Active && pendulum2Ref.current.isMouseOnBob(mouseX, mouseY)) {
        draggingPendulum = pendulum2Ref.current;
        draggingPendulum.isDragging = true;
      }
    };

    const handleMouseMove = (event) => {
      if (!draggingPendulum) return;

      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;
      draggingPendulum.setAngleFromMouse(mouseX, mouseY);
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
  }, [length, mass, airResistance, freeBodyDiagram, values, isAnimating, swingSpeed, pendulum1Active, pendulum2Active]);

  const handlePlayPauseClick = () => {
    setIsAnimating(prev => {
      if (!prev) {
        // If starting animation, do nothing special
        return true;
      } else {
        // If pausing animation, freeze pendulums
        if (pendulum1Ref.current) pendulum1Ref.current.angularVelocity = 0;
        if (pendulum2Ref.current) pendulum2Ref.current.angularVelocity = 0;
        return false;
      }
    });
  };
  

  const handleRestartClick = () => {
    setIsAnimating(false); // Stop the animation
    // Reset pendulum properties
    if (pendulum1Ref.current) pendulum1Ref.current.reset();
    if (pendulum2Ref.current) pendulum2Ref.current.reset();
    setLength(300);
    setMass(20);
    setSwingSpeed(1);
    // Bring pendulums to mean position
    setTimeout(() => {
      setIsAnimating(true); // Restart the animation
    }, 100); // Delay to ensure state is reset
  };

  const handleSpeedClick = () => {
    if (isAnimating) {
      setSwingSpeed(prevSpeed => prevSpeed * 1.5); // Increase speed by 50%
    }
  };

  const handleRemovePendulumClick = () => {
    if (pendulum1Active && pendulum2Active) {
      setPendulum2Active(false); // Remove pendulum2
    } else if (pendulum1Active) {
      setPendulum1Active(false); // Remove pendulum1
    }
  };

  return (
    <div className="container">
      <div className="left-panel">
        <canvas id="energyCanvas" width="200" height="300"></canvas>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} width={window.innerWidth - 500} height={window.innerHeight}></canvas>
        <div className="button-container">
          <button className="circular-button" onClick={handlePlayPauseClick}>{isAnimating ? '⏸️' : '▶️'}</button>
          <button className="circular-button" onClick={handleRestartClick}>🔄</button>
          <button className="circular-button" onClick={handleSpeedClick}>2x</button>
          <button className="circular-button" onClick={handleRemovePendulumClick}>🔽</button> {/* New button */}
        </div>
      </div>
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
          <br/>
          <label>
            <input
              type="checkbox"
              checked={freeBodyDiagram}
              onChange={(e) => setFreeBodyDiagram(e.target.checked)}
            />
            Freebody Diagram
          </label>
          <br/>
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