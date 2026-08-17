"use client";

import { useEffect, useRef } from "react";

type RankingThreeCrownProps = {
  animate: boolean;
};

export function RankingThreeCrown({ animate }: RankingThreeCrownProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let disposeScene: (() => void) | undefined;

    void import("three").then((THREE) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0.25, 7.2);

      const crown = new THREE.Group();
      crown.rotation.x = -0.08;
      scene.add(crown);

      const gold = new THREE.MeshStandardMaterial({
        color: 0xffc92f,
        emissive: 0x7a3500,
        emissiveIntensity: 0.3,
        metalness: 0.92,
        roughness: 0.2,
      });
      const jewel = new THREE.MeshPhysicalMaterial({
        color: 0xff2ed1,
        emissive: 0xff087f,
        emissiveIntensity: 1.1,
        metalness: 0.25,
        roughness: 0.12,
        clearcoat: 1,
      });

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.48, 1.58, 0.48, 64, 1, true),
        gold,
      );
      base.position.y = -0.72;
      crown.add(base);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.53, 0.13, 18, 72), gold);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -0.48;
      crown.add(rim);

      const spikes = 7;
      for (let index = 0; index < spikes; index += 1) {
        const angle = (index / spikes) * Math.PI * 2;
        const height = index % 2 === 0 ? 1.9 : 1.45;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.36, height, 5),
          gold,
        );
        spike.position.set(Math.sin(angle) * 1.18, 0.2 + height / 2, Math.cos(angle) * 0.58);
        spike.rotation.z = -Math.sin(angle) * 0.24;
        crown.add(spike);

        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), jewel);
        gem.position.set(
          Math.sin(angle) * 1.18,
          0.25 + height,
          Math.cos(angle) * 0.58,
        );
        crown.add(gem);
      }

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(2.05, 0.018, 8, 96),
        new THREE.MeshBasicMaterial({ color: 0xffe780, transparent: true, opacity: 0.45 }),
      );
      halo.rotation.x = Math.PI / 2.5;
      halo.position.y = 0.2;
      scene.add(halo);

      const burstGeometry = new THREE.BufferGeometry();
      const burstPositions = new Float32Array(150 * 3);
      for (let index = 0; index < 150; index += 1) {
        const angle = (index / 150) * Math.PI * 2;
        const radius = 1.4 + (index % 11) * 0.09;
        burstPositions[index * 3] = Math.cos(angle) * radius;
        burstPositions[index * 3 + 1] = Math.sin(angle * 3) * 0.7;
        burstPositions[index * 3 + 2] = Math.sin(angle) * radius * 0.35;
      }
      burstGeometry.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
      const burstMaterial = new THREE.PointsMaterial({
        color: 0xffdf63,
        size: 0.055,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const burst = new THREE.Points(burstGeometry, burstMaterial);
      scene.add(burst);

      scene.add(new THREE.AmbientLight(0xb88cff, 1.8));
      const keyLight = new THREE.DirectionalLight(0xffefad, 5.5);
      keyLight.position.set(3, 4, 5);
      scene.add(keyLight);
      const cyanLight = new THREE.PointLight(0x00e5ff, 16, 12);
      cyanLight.position.set(-3, 1, 3);
      scene.add(cyanLight);

      const resize = () => {
        const width = Math.max(canvas.clientWidth, 1);
        const height = Math.max(canvas.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      let pointerX = 0;
      let pointerY = 0;
      const handlePointerMove = (event: PointerEvent) => {
        const bounds = canvas.getBoundingClientRect();
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.65;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.3;
      };
      const resetPointer = () => {
        pointerX = 0;
        pointerY = 0;
      };
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerleave", resetPointer);

      const clock = new THREE.Clock();
      const render = () => {
        const elapsed = clock.getElapsedTime();
        crown.rotation.y += ((animate ? elapsed * 0.72 + pointerX : 0.35) - crown.rotation.y) * 0.08;
        crown.rotation.x += ((-0.08 - pointerY) - crown.rotation.x) * 0.08;
        crown.position.y = animate ? Math.sin(elapsed * 1.8) * 0.1 - 0.15 : -0.15;
        halo.rotation.z = animate ? elapsed * -0.28 : 0;
        const burstProgress = animate ? Math.min(elapsed / 1.2, 1) : 1;
        burst.scale.setScalar(0.2 + burstProgress * 1.25);
        burst.material.opacity = Math.max(0.18, 1 - elapsed * 0.22);
        burst.rotation.z = elapsed * 0.12;
        renderer.render(scene, camera);
        if (animate && !disposed) frame = window.requestAnimationFrame(render);
      };
      render();
      disposeScene = () => {
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerleave", resetPointer);
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      disposeScene?.();
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="h-36 w-full sm:h-40"
      aria-label="Coroa dourada tridimensional girando"
      role="img"
    />
  );
}
