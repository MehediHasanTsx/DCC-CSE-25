'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  ox: number; // Original / home X
  oy: number; // Original / home Y
  x: number;  // Current X
  y: number;  // Current Y
  vx: number;
  vy: number;
  opacity: number;
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationFrameId: number | null = null;
    let isRunning = false;
    let dots: Dot[] = [];
    let trail: TrailPoint[] = [];

    // Pointer state (viewport client coordinates)
    const pointer = {
      x: -9999,
      y: -9999,
      active: false,
    };

    // Configuration constants (clean, subtle & professional)
    const SPACING = 22; // Grid interval in pixels
    const BASE_RADIUS = 1.05; // Delicate, needle-sharp dot size
    const INTERACTION_RADIUS = 130; // Interaction zone around pointer
    const MAX_DISPLACEMENT = 11; // Space widening / repulsion
    const RETURN_SPRING = 0.08; // Spring return speed
    const DAMPING = 0.82; // Inertia damping
    const MAX_TRAIL_AGE = 380; // Lifespan so trail is a single smooth line and vanishes gracefully
    const MAX_TRAIL_POINTS = 22; // Keep as a single unified line (avoids multiple overlapping loops)

    // Theme detection
    let isDark = document.documentElement.classList.contains('dark');
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
      renderStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Re-initialize dot grid based on window size
    const initGrid = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const cols = Math.ceil(width / SPACING) + 2;
      const rows = Math.ceil(height / SPACING) + 2;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      dots = [];
      const baseOp = isDark ? 0.08 : 0.055;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = offsetX + c * SPACING;
          const oy = offsetY + r * SPACING;
          dots.push({
            ox,
            oy,
            x: ox,
            y: oy,
            vx: 0,
            vy: 0,
            opacity: baseOp,
          });
        }
      }

      renderStatic();
    };

    // Static render (when idle, no CPU animation loop needed)
    const renderStatic = () => {
      if (!ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);
      // Faint, whisper-soft dots
      const dotRgb = isDark ? '147, 197, 253' : '71, 85, 105';
      const baseOp = isDark ? 0.08 : 0.055;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        ctx.fillStyle = `rgba(${dotRgb}, ${baseOp})`;
        ctx.beginPath();
        ctx.arc(dot.ox, dot.oy, BASE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Animation loop (active when pointer moves, trail fades, or dots return to home)
    const loop = () => {
      if (!ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();
      let anyMoving = false;

      // Clean up aged trail points (line automatically shrinks and vanishes when stopped)
      while (trail.length > 0 && now - trail[0].time > MAX_TRAIL_AGE) {
        trail.shift();
      }

      const dotRgb = isDark ? '147, 197, 253' : '71, 85, 105';
      const highlightRgb = isDark ? '167, 139, 250' : '59, 130, 246';
      const baseOp = isDark ? 0.08 : 0.055;

      const px = pointer.x;
      const py = pointer.y;
      const isPointerActive = pointer.active;

      // 1. Draw single continuous smooth fading path line (cursor movement trail)
      if (trail.length > 2) {
        anyMoving = true;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let prevX = (trail[0].x + trail[1].x) / 2;
        let prevY = (trail[0].y + trail[1].y) / 2;

        for (let i = 1; i < trail.length - 1; i++) {
          const curr = trail[i];
          const next = trail[i + 1];
          const nextMidX = (curr.x + next.x) / 2;
          const nextMidY = (curr.y + next.y) / 2;

          const progress = i / (trail.length - 1);
          const age = now - curr.time;
          const life = Math.max(0, 1 - age / MAX_TRAIL_AGE);
          const alpha = life * Math.pow(progress, 1.2) * (isDark ? 0.75 : 0.6);

          if (alpha > 0.01) {
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.quadraticCurveTo(curr.x, curr.y, nextMidX, nextMidY);
            ctx.strokeStyle = isDark
              ? `rgba(168, 85, 247, ${alpha})`
              : `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1.4 + progress * 3.4; // 1.4px -> 4.8px at cursor head
            ctx.shadowBlur = 6;
            ctx.shadowColor = isDark
              ? `rgba(192, 132, 252, ${alpha * 0.7})`
              : `rgba(99, 102, 241, ${alpha * 0.6})`;
            ctx.stroke();
          }

          prevX = nextMidX;
          prevY = nextMidY;
        }

        // Final segment smoothly to head pointer
        const head = trail[trail.length - 1];
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(head.x, head.y);
        ctx.strokeStyle = isDark
          ? 'rgba(192, 132, 252, 0.85)'
          : 'rgba(99, 102, 241, 0.75)';
        ctx.lineWidth = 4.8;
        ctx.shadowBlur = 8;
        ctx.shadowColor = isDark
          ? 'rgba(192, 132, 252, 0.8)'
          : 'rgba(99, 102, 241, 0.7)';
        ctx.stroke();

        ctx.restore();
      }

      // 2. Update and draw dots with repulsion physics
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        let targetX = dot.ox;
        let targetY = dot.oy;
        let targetOpacity = baseOp;
        let isNearCursor = false;

        if (isPointerActive) {
          const dx = dot.ox - px;
          const dy = dot.oy - py;
          const distSq = dx * dx + dy * dy;
          const radSq = INTERACTION_RADIUS * INTERACTION_RADIUS;

          if (distSq < radSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            // Non-linear smooth repulsion (space between dots widens around cursor)
            const force = (1 - dist / INTERACTION_RADIUS);
            const easeForce = force * force;
            const push = easeForce * MAX_DISPLACEMENT;

            targetX = dot.ox + (dx / dist) * push;
            targetY = dot.oy + (dy / dist) * push;
            targetOpacity = baseOp + force * 0.16;
            isNearCursor = true;
          }
        }

        // Spring physics towards target
        const ax = (targetX - dot.x) * RETURN_SPRING;
        const ay = (targetY - dot.y) * RETURN_SPRING;

        dot.vx = (dot.vx + ax) * DAMPING;
        dot.vy = (dot.vy + ay) * DAMPING;

        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.opacity += (targetOpacity - dot.opacity) * 0.16;

        // Check if dot is still transitioning
        if (
          Math.abs(dot.x - dot.ox) > 0.04 ||
          Math.abs(dot.y - dot.oy) > 0.04 ||
          Math.abs(dot.vx) > 0.01 ||
          Math.abs(dot.vy) > 0.01
        ) {
          anyMoving = true;
        }

        // Draw dot
        const currentRadius = isNearCursor
          ? BASE_RADIUS + 0.25
          : BASE_RADIUS;

        ctx.fillStyle = isNearCursor
          ? `rgba(${highlightRgb}, ${dot.opacity})`
          : `rgba(${dotRgb}, ${dot.opacity})`;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // If pointer is still active, trail is fading, or dots are settling: keep loop alive
      if (isPointerActive || anyMoving || trail.length > 0) {
        animationFrameId = requestAnimationFrame(loop);
      } else {
        // Snap to rest and sleep loop for 0% CPU consumption
        for (let i = 0; i < dots.length; i++) {
          dots[i].x = dots[i].ox;
          dots[i].y = dots[i].oy;
          dots[i].vx = 0;
          dots[i].vy = 0;
          dots[i].opacity = baseOp;
        }
        renderStatic();
        isRunning = false;
        animationFrameId = null;
      }
    };

    const wakeAnimation = () => {
      if (prefersReducedMotion) {
        renderStatic();
        return;
      }
      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    // Record trail points and pointer position
    const addTrailPoint = (x: number, y: number) => {
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;

      const now = performance.now();
      const last = trail[trail.length - 1];

      // Add point if distance is meaningful (smoother trail, avoid duplicates)
      if (!last || Math.hypot(x - last.x, y - last.y) >= 2.5) {
        trail.push({ x, y, time: now });
        if (trail.length > MAX_TRAIL_POINTS) {
          trail.shift();
        }
      }

      wakeAnimation();
    };

    // Pointer events (passive, window-level)
    const handlePointerMove = (e: PointerEvent) => {
      addTrailPoint(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        addTrailPoint(touch.clientX, touch.clientY);
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      wakeAnimation();
    };

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        initGrid();
      }, 100);
    };

    // Attach listeners
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('touchend', handlePointerLeave, { passive: true });
    window.addEventListener('resize', handleResize);

    initGrid();

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 h-full w-full select-none"
    />
  );
}
