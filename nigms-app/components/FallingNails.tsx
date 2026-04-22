"use client";

import { useEffect, useRef } from "react";

interface Nail {
  x: number;
  y: number;
  speed: number;
  angle: number;        // rotation in radians
  rotationSpeed: number;
  length: number;
  opacity: number;
}

function createNail(canvasWidth: number, canvasHeight: number): Nail {
  return {
    x: Math.random() * canvasWidth,
    y: -40 - Math.random() * canvasHeight,
    speed: 0.4 + Math.random() * 0.8,   // slow fall
    angle: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.008,
    length: 18 + Math.random() * 14,
    opacity: 0.15 + Math.random() * 0.35,
  };
}

function drawNail(ctx: CanvasRenderingContext2D, nail: Nail) {
  ctx.save();
  ctx.translate(nail.x, nail.y);
  ctx.rotate(nail.angle);
  ctx.globalAlpha = nail.opacity;

  const headR = nail.length * 0.12;
  const shaftW = nail.length * 0.06;
  const shaftL = nail.length * 0.75;
  const pointL = nail.length * 0.18;

  // Shaft — steel grey
  ctx.fillStyle = "#4A4A4A";
  ctx.fillRect(-shaftW / 2, -shaftL / 2, shaftW, shaftL);

  // Head — slightly lighter steel
  ctx.beginPath();
  ctx.arc(0, -shaftL / 2, headR, 0, Math.PI * 2);
  ctx.fillStyle = "#6b7280";
  ctx.fill();

  // Point — orange accent tip
  ctx.beginPath();
  ctx.moveTo(-shaftW / 2, shaftL / 2);
  ctx.lineTo(shaftW / 2, shaftL / 2);
  ctx.lineTo(0, shaftL / 2 + pointL);
  ctx.closePath();
  ctx.fillStyle = "#f97316";
  ctx.fill();

  ctx.restore();
}

export default function FallingNails() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const NAIL_COUNT = 55;
    let nails: Nail[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      // Respawn nails spread across full height on resize
      nails = Array.from({ length: NAIL_COUNT }, () => {
        const n = createNail(canvas.width, canvas.height);
        n.y = Math.random() * canvas.height; // start scattered, not all at top
        return n;
      });
    };

    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const nail of nails) {
        nail.y += nail.speed;
        nail.angle += nail.rotationSpeed;

        if (nail.y > canvas.height + 40) {
          // Reset to top
          Object.assign(nail, createNail(canvas.width, canvas.height));
          nail.y = -40;
        }

        drawNail(ctx, nail);
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "linear-gradient(135deg, #00030787 0%, #07142fd2 50%, #0a1f44 100%)" }}
    />
  );
}
