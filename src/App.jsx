import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  EnvelopeSimple,
  GithubLogo,
  List,
  X,
} from "@phosphor-icons/react";
import {
  articles,
  featuredArticle,
  formatArticleDate,
} from "./content/articles/index.js";

const projects = [
  { id: "01", title: "边界之外", kicker: "WEBGL / 交互体验", year: "2026", description: "一次关于未知与边界的沉浸式旅程。用实时渲染把抽象概念变成可探索的数字空间。", image: "/assets/projects/beyond-boundary.png", align: "right" },
  { id: "02", title: "流动的城市", kicker: "数据可视化 / 装置", year: "2025", description: "把城市的呼吸、噪声与节奏转译成不断生长的数据景观，让信息拥有可以被感知的温度。", image: "/assets/projects/city-flow.png", align: "left" },
  { id: "03", title: "生长算法", kicker: "GENERATIVE / 动态影像", year: "2025", description: "探索自然生长与算法规则的共生关系。每一次运算，都生成一段独一无二的数字生命。", image: "/assets/projects/growth-algorithm.png", align: "right" },
  { id: "04", title: "无界阅读", kicker: "APP DESIGN / UX", year: "2024", description: "一个为深度阅读设计的移动体验，减少界面噪声，让注意力重新回到内容本身。", image: "/assets/projects/unbound-reading.png", align: "left" },
];

const sectionRailItems = [
  { id: "top", number: "01", label: "首页" },
  { id: "projects", number: "02", label: "作品" },
  { id: "about", number: "03", label: "关于" },
  { id: "notes", number: "04", label: "文章" },
  { id: "contact", number: "05", label: "联系" },
];

const technologyGroups = [
  { index: "01", label: "FRONTEND", title: "界面工程", skills: ["React", "JavaScript", "HTML / CSS", "Vite"] },
  { index: "02", label: "REAL-TIME 3D", title: "创意开发", skills: ["Three.js", "WebGL", "Particle Systems", "Physics"] },
  { index: "03", label: "EXPERIENCE", title: "交互体验", skills: ["Motion Systems", "Responsive UI", "Accessibility", "Performance"] },
  { index: "04", label: "WORKFLOW", title: "工程交付", skills: ["Git / GitHub", "Design Systems", "Content Architecture", "Deployment"] },
];
function useScrollProgress() {
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll-progress", `${max > 0 ? Math.min(1, window.scrollY / max) : 0}`);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.body);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
}

function useFullPageSnap(enabled) {
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.dataset.snapPaused = "true";
      return () => { delete root.dataset.snapPaused; };
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const getPanels = () => [...document.querySelectorAll(".snap-panel")];
    const panelTop = (panel) => panel.getBoundingClientRect().top + window.scrollY;
    const nearestIndex = () => {
      const panels = getPanels();
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      panels.forEach((panel, index) => {
        const distance = Math.abs(panel.getBoundingClientRect().top);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      return nearest;
    };
    const clampIndex = (index) => Math.max(0, Math.min(getPanels().length - 1, index));

    let lockedUntil = 0;
    let unlockTimer;
    let settleTimer;
    let resizeTimer;
    let wheelDistance = 0;
    let gestureIndex = null;
    let touchStartY = 0;
    let touchDistance = 0;
    let touchIndex = null;
    let touchTracking = false;

    const setSnapMetadata = (index) => {
      root.dataset.snapPanels = String(getPanels().length);
      root.dataset.snapIndex = String(index);
      root.dataset.snapThreshold = String(Math.round(Math.max(88, window.innerHeight * 0.12)));
    };

    const snapTo = (requestedIndex) => {
      const panels = getPanels();
      if (!panels.length) return;
      const index = Math.max(0, Math.min(panels.length - 1, requestedIndex));
      window.clearTimeout(unlockTimer);
      window.clearTimeout(settleTimer);
      root.classList.remove("is-snap-gesturing");
      wheelDistance = 0;
      gestureIndex = null;
      touchDistance = 0;
      touchIndex = null;
      const duration = reduceMotion ? 40 : 680;
      lockedUntil = window.performance.now() + duration;
      panels[index].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setSnapMetadata(index);
      unlockTimer = window.setTimeout(() => { lockedUntil = 0; }, duration);
    };

    const previewGesture = (index, distance, strength = 0.24) => {
      const panels = getPanels();
      const panel = panels[clampIndex(index)];
      if (!panel) return;
      const limit = Math.min(118, window.innerHeight * 0.15);
      const offset = Math.max(-limit, Math.min(limit, distance * strength));
      root.classList.add("is-snap-gesturing");
      window.scrollTo(0, panelTop(panel) + offset);
    };

    const isReaderEvent = (event) => event.target?.closest?.(".article-reader");
    const onWheel = (event) => {
      if (isReaderEvent(event) || event.ctrlKey) return;
      event.preventDefault();
      if (window.performance.now() < lockedUntil) return;
      if (gestureIndex === null) gestureIndex = nearestIndex();
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      wheelDistance += event.deltaY * multiplier;
      const threshold = Math.max(88, window.innerHeight * 0.12);
      previewGesture(gestureIndex, wheelDistance);
      window.clearTimeout(settleTimer);
      if (Math.abs(wheelDistance) >= threshold) {
        const direction = wheelDistance > 0 ? 1 : -1;
        snapTo(gestureIndex + direction);
      } else {
        const returnIndex = gestureIndex;
        settleTimer = window.setTimeout(() => snapTo(returnIndex), 150);
      }
    };

    const onTouchStart = (event) => {
      if (isReaderEvent(event) || event.touches.length !== 1 || window.performance.now() < lockedUntil) return;
      touchStartY = event.touches[0].clientY;
      touchDistance = 0;
      touchIndex = nearestIndex();
      touchTracking = true;
    };

    const onTouchMove = (event) => {
      if (!touchTracking || isReaderEvent(event) || event.touches.length !== 1) return;
      touchDistance = touchStartY - event.touches[0].clientY;
      if (Math.abs(touchDistance) > 4 && event.cancelable) event.preventDefault();
      previewGesture(touchIndex, touchDistance, 0.32);
    };

    const onTouchEnd = () => {
      if (!touchTracking) return;
      touchTracking = false;
      const threshold = Math.max(62, window.innerHeight * 0.1);
      const direction = touchDistance > 0 ? 1 : -1;
      snapTo(Math.abs(touchDistance) >= threshold ? touchIndex + direction : touchIndex);
    };

    const onKeyDown = (event) => {
      if (document.querySelector(".article-reader")) return;
      if (event.target?.closest?.("a, button, input, textarea, select, [contenteditable='true']")) return;
      const current = nearestIndex();
      let next = null;
      if (["ArrowDown", "PageDown"].includes(event.key)) next = current + 1;
      if (["ArrowUp", "PageUp"].includes(event.key)) next = current - 1;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = getPanels().length - 1;
      if (next === null) return;
      event.preventDefault();
      snapTo(next);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => snapTo(nearestIndex()), 120);
    };

    setSnapMetadata(nearestIndex());
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(unlockTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(resizeTimer);
      root.classList.remove("is-snap-gesturing");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      delete root.dataset.snapPanels;
      delete root.dataset.snapIndex;
      delete root.dataset.snapThreshold;
    };
  }, [enabled]);
}
function AsteroidScene() {
  const canvasRef = useRef(null);
  const statusRef = useRef(null);
  const cycleRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCompact = window.innerWidth < 720;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0.15, 0.04, 7.9);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.3 : 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const systemGroup = new THREE.Group();
    systemGroup.rotation.set(-0.12, -0.28, 0.05);
    scene.add(systemGroup);

    const hash = (x, y = 0) => {
      const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };
    const smoothstep = (value) => value * value * (3 - 2 * value);
    const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);
    const easeInOutCubic = (value) =>
      value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const textureSize = 256;
    const textureData = new Uint8Array(textureSize * textureSize * 4);
    const smoothNoise = (x, y) => {
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const tx = x - x0;
      const ty = y - y0;
      const sx = smoothstep(tx);
      const sy = smoothstep(ty);
      const top = hash(x0, y0) * (1 - sx) + hash(x0 + 1, y0) * sx;
      const bottom = hash(x0, y0 + 1) * (1 - sx) + hash(x0 + 1, y0 + 1) * sx;
      return top * (1 - sy) + bottom * sy;
    };

    for (let y = 0; y < textureSize; y += 1) {
      for (let x = 0; x < textureSize; x += 1) {
        let noise = 0;
        let amplitude = 1;
        let frequency = 0.032;
        let amplitudeSum = 0;
        for (let octave = 0; octave < 5; octave += 1) {
          noise += smoothNoise(x * frequency, y * frequency) * amplitude;
          amplitudeSum += amplitude;
          amplitude *= 0.52;
          frequency *= 2.08;
        }
        const grain = hash(x * 3.17, y * 2.79) * 0.13;
        const value = Math.max(0, Math.min(255, ((noise / amplitudeSum) * 0.87 + grain) * 255));
        const offset = (y * textureSize + x) * 4;
        textureData[offset] = value;
        textureData[offset + 1] = value;
        textureData[offset + 2] = value;
        textureData[offset + 3] = 255;
      }
    }

    const rockTexture = new THREE.DataTexture(textureData, textureSize, textureSize, THREE.RGBAFormat);
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.repeat.set(2.8, 1.6);
    rockTexture.needsUpdate = true;

    const createIrregularGeometry = (radius, seed) => {
      const geometry = mergeVertices(new THREE.IcosahedronGeometry(radius, isCompact ? 4 : 6), 0.0001);
      const positions = geometry.attributes.position;
      const vertex = new THREE.Vector3();
      for (let index = 0; index < positions.count; index += 1) {
        vertex.fromBufferAttribute(positions, index);
        const direction = vertex.clone().normalize();
        const waveA =
          Math.sin(direction.x * (6.6 + seed) + direction.z * 2.7) *
          Math.cos(direction.y * (8.1 + seed * 0.3) - direction.x * 3.2);
        const waveB = Math.sin((direction.x + direction.y + direction.z) * (12.4 + seed)) * 0.48;
        const ridge = Math.cos(direction.z * (18.5 + seed) - direction.y * 4.4) * 0.26;
        const displacement = 1 + waveA * 0.13 + waveB * 0.078 + ridge * 0.05;
        vertex.copy(direction.multiplyScalar(radius * displacement));
        positions.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
      geometry.computeVertexNormals();
      return geometry;
    };

    const initialState = [
      {
        mass: 1.3,
        radius: 0.34,
        position: new THREE.Vector3(-2.4, 0.5, 0.65),
        velocity: new THREE.Vector3(),
        color: 0x71879a,
        trail: 0x8aa8bf,
      },
      {
        mass: 1,
        radius: 0.28,
        position: new THREE.Vector3(2.15, 0.65, -0.85),
        velocity: new THREE.Vector3(),
        color: 0x566b7e,
        trail: 0x516f93,
      },
      {
        mass: 0.82,
        radius: 0.23,
        position: new THREE.Vector3(0.15, -2.2, 0.35),
        velocity: new THREE.Vector3(),
        color: 0x899aa9,
        trail: 0x71869c,
      },
    ];

    let cycleNumber = 0;
    let cycleSeed = 0;
    const randomValue = () => {
      if (window.crypto?.getRandomValues) {
        const value = new Uint32Array(1);
        window.crypto.getRandomValues(value);
        return value[0] / 4294967296;
      }
      return Math.random();
    };

    const randomUnitVector = () => {
      const z = randomValue() * 2 - 1;
      const angle = randomValue() * Math.PI * 2;
      const radius = Math.sqrt(Math.max(0, 1 - z * z));
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    };

    const randomizeMomentum = () => {
      cycleNumber += 1;
      cycleSeed = randomValue() * 10000;
      const centerVelocity = new THREE.Vector3();
      const totalMass = initialState.reduce((sum, body) => sum + body.mass, 0);

      initialState.forEach((body) => {
        const inward = body.position.clone().normalize().multiplyScalar(-1);
        const tangent = new THREE.Vector3().crossVectors(inward, randomUnitVector());
        if (tangent.lengthSq() < 0.0001) tangent.crossVectors(inward, new THREE.Vector3(0, 1, 0));
        tangent.normalize();
        const binormal = new THREE.Vector3().crossVectors(inward, tangent).normalize();
        const inwardSpeed = 0.06 + randomValue() * 0.07;
        const tangentSpeed = (randomValue() - 0.5) * 0.56;
        const binormalSpeed = (randomValue() - 0.5) * 0.32;
        body.velocity
          .copy(inward)
          .multiplyScalar(inwardSpeed)
          .addScaledVector(tangent, tangentSpeed)
          .addScaledVector(binormal, binormalSpeed);
        centerVelocity.addScaledVector(body.velocity, body.mass);
      });

      centerVelocity.multiplyScalar(1 / totalMass);
      initialState.forEach((body) => body.velocity.sub(centerVelocity));
      canvas.dataset.cycle = String(cycleNumber);
      canvas.dataset.collisionScale = "0.42";
      canvas.dataset.momentum = initialState
        .map((body) => body.velocity.toArray().map((value) => value.toFixed(5)).join(","))
        .join("|");
    };

    const bodyStates = initialState.map((body) => ({
      mass: body.mass,
      radius: body.radius,
      position: body.position.clone(),
      velocity: body.velocity.clone(),
    }));

    const trailLength = isCompact ? 90 : 180;
    const bodies = initialState.map((body, index) => {
      const group = new THREE.Group();
      const geometry = createIrregularGeometry(body.radius, index * 2.73 + 1);
      const material = new THREE.MeshStandardMaterial({
        color: body.color,
        emissive: new THREE.Color(body.color).multiplyScalar(0.1),
        emissiveIntensity: 0.8,
        roughness: 0.92,
        metalness: 0.035,
        map: rockTexture,
        bumpMap: rockTexture,
        bumpScale: 0.2,
        flatShading: true,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set(hash(index, 4) * 2, hash(index, 9) * 2, hash(index, 14) * 2);
      group.add(mesh);
      group.position.copy(body.position);
      systemGroup.add(group);

      const trailPositions = new Float32Array(trailLength * 3);
      for (let point = 0; point < trailLength; point += 1) {
        trailPositions[point * 3] = body.position.x;
        trailPositions[point * 3 + 1] = body.position.y;
        trailPositions[point * 3 + 2] = body.position.z;
      }
      const trailGeometry = new THREE.BufferGeometry();
      trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
      const trailMaterial = new THREE.LineBasicMaterial({
        color: body.trail,
        transparent: true,
        opacity: index === 0 ? 0.38 : 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trail = new THREE.Line(trailGeometry, trailMaterial);
      systemGroup.add(trail);
      const trailPointsMaterial = new THREE.PointsMaterial({
        color: body.trail,
        size: index === 0 ? 0.026 : 0.019,
        transparent: true,
        opacity: index === 0 ? 0.46 : 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const trailPoints = new THREE.Points(trailGeometry, trailPointsMaterial);
      systemGroup.add(trailPoints);

      return {
        group,
        mesh,
        geometry,
        material,
        trail,
        trailGeometry,
        trailMaterial,
        trailPoints,
        trailPointsMaterial,
      };
    });

    canvas.dataset.asteroidModel = "procedural-fallback";
    let sceneDisposed = false;
    let bennuTexture = null;
    const disposeImportedScene = (root, disposeTextures = false) => {
      root.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          if (!material) return;
          if (disposeTextures) {
            Object.values(material).forEach((value) => {
              if (value?.isTexture) value.dispose();
            });
          }
          material.dispose();
        });
      });
    };
    const modelTints = [0xc5d2dc, 0xa8bac8, 0xd6dfe5];
    const modelLoader = new GLTFLoader();
    modelLoader.load(
      "/assets/models/bennu.glb",
      (gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const sourceMesh = gltf.scene.getObjectByProperty("isMesh", true);
        if (!sourceMesh || sceneDisposed) {
          disposeImportedScene(gltf.scene, true);
          return;
        }

        const normalizedGeometry = sourceMesh.geometry.clone();
        normalizedGeometry.applyMatrix4(sourceMesh.matrixWorld);
        normalizedGeometry.center();
        normalizedGeometry.computeVertexNormals();
        normalizedGeometry.computeBoundingSphere();
        const sourceRadius = normalizedGeometry.boundingSphere?.radius || 1;
        normalizedGeometry.scale(1 / sourceRadius, 1 / sourceRadius, 1 / sourceRadius);
        normalizedGeometry.computeBoundingSphere();

        const sourceMaterials = Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material];
        bennuTexture = sourceMaterials.find((material) => material?.map)?.map || null;
        if (bennuTexture) {
          bennuTexture.colorSpace = THREE.SRGBColorSpace;
          bennuTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          bennuTexture.needsUpdate = true;
        }

        bodies.forEach((body, index) => {
          const previousGeometry = body.geometry;
          const replacementGeometry = normalizedGeometry.clone();
          body.geometry = replacementGeometry;
          body.mesh.geometry = replacementGeometry;
          body.mesh.scale.setScalar(initialState[index].radius);
          body.material.color.setHex(modelTints[index]);
          body.material.emissive.copy(body.material.color).multiplyScalar(0.085);
          body.material.emissiveIntensity = 0.72;
          body.material.roughness = 0.9;
          body.material.metalness = 0.02;
          body.material.flatShading = false;
          if (bennuTexture) body.material.map = bennuTexture;
          body.material.bumpMap = rockTexture;
          body.material.bumpScale = 0.075;
          body.material.needsUpdate = true;
          previousGeometry.dispose();
        });

        normalizedGeometry.dispose();
        disposeImportedScene(gltf.scene);
        canvas.dataset.asteroidModel = "nasa-bennu";
      },
      undefined,
      () => {
        canvas.dataset.asteroidModel = "procedural-fallback";
      },
    );
    const createFieldGeometry = (count, baseRadius, seed) => {
      const positions = [];
      for (let index = 0; index < count; index += 1) {
        const y = 1 - (index / Math.max(1, count - 1)) * 2;
        const radial = Math.sqrt(Math.max(0, 1 - y * y));
        const angle = index * 2.399963 + seed;
        const distance = baseRadius + (hash(index, seed) - 0.5) * 0.72;
        positions.push(
          Math.cos(angle) * radial * distance,
          y * distance,
          Math.sin(angle) * radial * distance,
        );
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      return geometry;
    };

    const ringMaterial = new THREE.PointsMaterial({
      color: 0x7894aa,
      size: 0.018,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const energyRing = new THREE.Points(createFieldGeometry(isCompact ? 54 : 92, 2.74, 0.8), ringMaterial);
    energyRing.rotation.set(0.28, 0.35, -0.18);
    systemGroup.add(energyRing);

    const bandMaterial = new THREE.PointsMaterial({
      color: 0x405d78,
      size: 0.012,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const energyBand = new THREE.Points(createFieldGeometry(isCompact ? 28 : 46, 3.3, 2.4), bandMaterial);
    energyBand.rotation.set(-0.35, 0.2, 0.44);
    systemGroup.add(energyBand);

    const shockwaveMaterial = new THREE.MeshBasicMaterial({
      color: 0xd7ff55,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shockwave = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 12, 120), shockwaveMaterial);
    shockwave.visible = false;
    systemGroup.add(shockwave);

    const shardCount = isCompact ? 42 : 84;
    const shardGeometry = new THREE.TetrahedronGeometry(0.065, 1);
    const shardMaterial = new THREE.MeshStandardMaterial({
      color: 0x53677b,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: true,
      transparent: true,
      opacity: 1,
    });
    const shardMesh = new THREE.InstancedMesh(shardGeometry, shardMaterial, shardCount);
    shardMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    shardMesh.visible = false;
    systemGroup.add(shardMesh);

    const unitVectorFromSeed = (seed) => {
      const z = hash(seed, 7.4) * 2 - 1;
      const angle = hash(seed, 13.1) * Math.PI * 2;
      const radius = Math.sqrt(Math.max(0, 1 - z * z));
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    };

    const shardData = Array.from({ length: shardCount }, (_, index) => {
      const bodyIndex = index % 3;
      shardMesh.setColorAt(index, new THREE.Color(index % 7 === 0 ? 0xc8ff23 : initialState[bodyIndex].color));
      return {
        bodyIndex,
        seed: index + 1,
        scale: 0.42 + hash(index, 21) * 1.25,
        spin: unitVectorFromSeed(index + 31).multiplyScalar(2 + hash(index, 38) * 4),
        direction: new THREE.Vector3(),
        start: new THREE.Vector3(),
        end: new THREE.Vector3(),
        target: new THREE.Vector3(),
      };
    });
    if (shardMesh.instanceColor) shardMesh.instanceColor.needsUpdate = true;

    const starPositions = [];
    const starCount = isCompact ? 150 : 280;
    for (let index = 0; index < starCount; index += 1) {
      const angle = index * 2.39996;
      const radius = 3.1 + hash(index, 2) * 3.5;
      starPositions.push(
        Math.cos(angle) * radius,
        (hash(index, 6) - 0.5) * 6.2,
        Math.sin(angle) * radius - 1.8,
      );
    }
    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0x8297aa,
      size: 0.018,
      transparent: true,
      opacity: 0.5,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    scene.add(new THREE.HemisphereLight(0xc4d5e2, 0x02050b, 0.84));
    const keyLight = new THREE.DirectionalLight(0xf0f4f7, 4.8);
    keyLight.position.set(-3.8, 5.2, 4.8);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x6289ad, 5.4, 12);
    rimLight.position.set(3.6, -1.5, 2.5);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x8aa4ba, 2.3, 10);
    fillLight.position.set(-3.2, -1.8, 4.4);
    scene.add(fillLight);
    const collisionLight = new THREE.PointLight(0xd7ff55, 0, 10);
    scene.add(collisionLight);

    const accelerations = bodyStates.map(() => new THREE.Vector3());
    const difference = new THREE.Vector3();
    const collisionPoint = new THREE.Vector3();
    const dummy = new THREE.Object3D();
    const tempPosition = new THREE.Vector3();
    const baseGravity = 0.25;
    const softening = 0.14;
    const fixedStep = 1 / 120;
    const collisionScale = 0.42;
    let accumulator = 0;
    let orbitAge = 0;
    let phase = "orbit";
    let phaseTime = 0;
    let runningTime = 0;
    let frameCount = 0;

    const setStatus = (primary, secondary, alert = false) => {
      if (statusRef.current) {
        statusRef.current.textContent = primary;
        statusRef.current.style.color = alert ? "#c8ff23" : "";
      }
      if (cycleRef.current) cycleRef.current.textContent = secondary;
    };

    const resetTrails = () => {
      bodies.forEach((body, index) => {
        const attribute = body.trailGeometry.attributes.position;
        for (let point = 0; point < trailLength; point += 1) {
          attribute.setXYZ(point, initialState[index].position.x, initialState[index].position.y, initialState[index].position.z);
        }
        attribute.needsUpdate = true;
        body.trailMaterial.opacity = index === 0 ? 0.38 : 0.24;
        body.trailPointsMaterial.opacity = index === 0 ? 0.46 : 0.3;
      });
    };

    const resetSimulation = () => {
      randomizeMomentum();
      phase = "orbit";
      phaseTime = 0;
      accumulator = 0;
      orbitAge = 0;
      bodyStates.forEach((state, index) => {
        state.position.copy(initialState[index].position);
        state.velocity.copy(initialState[index].velocity);
        bodies[index].group.position.copy(state.position);
        bodies[index].group.scale.setScalar(1);
        bodies[index].group.visible = true;
        bodies[index].material.opacity = 1;
      });
      shardMesh.visible = false;
      shardMaterial.opacity = 1;
      shockwave.visible = false;
      shockwaveMaterial.opacity = 0;
      collisionLight.intensity = 0;
      ringMaterial.opacity = 0.16;
      bandMaterial.opacity = 0.08;
      resetTrails();
      setStatus(
        reduceMotion ? "THREE-BODY / REDUCED" : "THREE-BODY / CHAOTIC 3D",
        `MOMENTUM / RANDOMIZED ${String(cycleNumber).padStart(2, "0")}`,
      );
    };

    const triggerCollision = (firstIndex, secondIndex) => {
      phase = "explode";
      phaseTime = 0;
      collisionPoint
        .copy(bodyStates[firstIndex].position)
        .add(bodyStates[secondIndex].position)
        .multiplyScalar(0.5);
      shockwave.position.copy(collisionPoint);
      shockwave.scale.setScalar(0.2);
      shockwave.visible = true;
      collisionLight.position.copy(collisionPoint);
      collisionLight.intensity = 11;

      shardData.forEach((shard) => {
        const bodyIndex = shard.bodyIndex;
        const state = bodyStates[bodyIndex];
        const initialBody = initialState[bodyIndex];
        const surfaceDirection = unitVectorFromSeed(shard.seed * 1.37 + cycleSeed * 0.017 + 5);
        const burstDirection = unitVectorFromSeed(shard.seed * 2.11 + cycleSeed * 0.031 + 17);
        const radial = state.position.clone().sub(collisionPoint).normalize();
        shard.start
          .copy(state.position)
          .addScaledVector(surfaceDirection, initialBody.radius * (0.12 + hash(shard.seed, 4) * 0.28));
        shard.direction
          .copy(burstDirection)
          .multiplyScalar(0.8)
          .addScaledVector(radial, 0.55)
          .add(new THREE.Vector3(0, 0.12, 0))
          .normalize();
        shard.end
          .copy(shard.start)
          .addScaledVector(shard.direction, 1.35 + hash(shard.seed, 19) * 2.3);
        shard.target
          .copy(initialBody.position)
          .addScaledVector(surfaceDirection, initialBody.radius * (0.32 + hash(shard.seed, 27) * 0.55));
      });

      setStatus("COLLISION / FRACTURE", "SYSTEM INTEGRITY / 00%", true);
    };

    const stepGravity = (delta) => {
      orbitAge += delta;
      const gravity = baseGravity + Math.min(orbitAge / 32, 1) * 0.2;
      accelerations.forEach((vector) => vector.set(0, 0, 0));
      for (let first = 0; first < bodyStates.length; first += 1) {
        for (let second = first + 1; second < bodyStates.length; second += 1) {
          difference.subVectors(bodyStates[second].position, bodyStates[first].position);
          const distanceSquared = difference.lengthSq() + softening * softening;
          const factor = gravity / (distanceSquared * Math.sqrt(distanceSquared));
          accelerations[first].addScaledVector(difference, factor * bodyStates[second].mass);
          accelerations[second].addScaledVector(difference, -factor * bodyStates[first].mass);
        }
      }

      bodyStates.forEach((state, index) => {
        state.velocity.addScaledVector(accelerations[index], delta);
        if (orbitAge > 32) state.velocity.multiplyScalar(0.9992);
        state.position.addScaledVector(state.velocity, delta);
      });

      for (let first = 0; first < bodyStates.length; first += 1) {
        for (let second = first + 1; second < bodyStates.length; second += 1) {
          const distance = bodyStates[first].position.distanceTo(bodyStates[second].position);
          const collisionDistance = (bodyStates[first].radius + bodyStates[second].radius) * collisionScale;
          if (distance < collisionDistance) {
            triggerCollision(first, second);
            return true;
          }
        }
      }
      return false;
    };

    const updateTrails = () => {
      bodies.forEach((body, index) => {
        const attribute = body.trailGeometry.attributes.position;
        for (let point = trailLength - 1; point > 0; point -= 1) {
          attribute.setXYZ(
            point,
            attribute.getX(point - 1),
            attribute.getY(point - 1),
            attribute.getZ(point - 1),
          );
        }
        attribute.setXYZ(0, bodyStates[index].position.x, bodyStates[index].position.y, bodyStates[index].position.z);
        attribute.needsUpdate = true;
      });
    };

    const updateShardMatrices = (mode, progress) => {
      const eased = mode === "explode" ? easeOutCubic(progress) : easeInOutCubic(progress);
      shardData.forEach((shard, index) => {
        if (mode === "explode") {
          tempPosition.lerpVectors(shard.start, shard.end, eased);
        } else {
          tempPosition.lerpVectors(shard.end, shard.target, eased);
        }
        dummy.position.copy(tempPosition);
        const rotationFactor = mode === "explode" ? eased : 1 - eased;
        dummy.rotation.set(
          shard.spin.x * rotationFactor,
          shard.spin.y * rotationFactor,
          shard.spin.z * rotationFactor,
        );
        const reassemblyFade = mode === "reassemble" ? 1 - smoothstep(Math.max(0, (progress - 0.74) / 0.26)) * 0.65 : 1;
        dummy.scale.setScalar(shard.scale * reassemblyFade);
        dummy.updateMatrix();
        shardMesh.setMatrixAt(index, dummy.matrix);
      });
      shardMesh.instanceMatrix.needsUpdate = true;
    };

    const updateCollisionCycle = (delta) => {
      phaseTime += delta;
      if (phase === "explode") {
        const progress = Math.min(phaseTime / 0.85, 1);
        const eased = easeOutCubic(progress);
        shardMesh.visible = true;
        shardMaterial.opacity = 1;
        updateShardMatrices("explode", progress);
        bodies.forEach((body) => {
          body.group.scale.setScalar(Math.max(0.035, 1 - eased * 1.08));
          body.material.opacity = Math.max(0, 1 - eased * 1.2);
          body.trailMaterial.opacity *= 0.94;
          body.trailPointsMaterial.opacity *= 0.94;
        });
        shockwave.scale.setScalar(0.25 + eased * 5.5);
        shockwaveMaterial.opacity = (1 - progress) * 0.9;
        collisionLight.intensity = (1 - progress) * 12;
        ringMaterial.opacity = 0.42 + Math.sin(progress * Math.PI) * 0.52;
        bandMaterial.opacity = 0.08 + Math.sin(progress * Math.PI) * 0.24;
        if (progress >= 1) {
          phase = "hold";
          phaseTime = 0;
          bodies.forEach((body) => { body.group.visible = false; });
          setStatus("DEBRIS FIELD / UNSTABLE", "AUTO-REPAIR / STANDBY", true);
        }
        return;
      }

      if (phase === "hold") {
        const progress = Math.min(phaseTime / 0.18, 1);
        shockwaveMaterial.opacity = 0;
        collisionLight.intensity = 0;
        ringMaterial.opacity = 0.25 + Math.sin(runningTime * 8) * 0.08;
        if (progress >= 1) {
          phase = "reassemble";
          phaseTime = 0;
          setStatus("REASSEMBLING / MAGNETIC", "RECOVERY / 00%", true);
        }
        return;
      }

      if (phase === "reassemble") {
        const progress = Math.min(phaseTime / 1.35, 1);
        updateShardMatrices("reassemble", progress);
        shardMaterial.opacity = 1 - smoothstep(Math.max(0, (progress - 0.72) / 0.28));
        ringMaterial.opacity = 0.3 + Math.sin(progress * Math.PI * 5) * 0.18;
        bandMaterial.opacity = 0.1 + Math.sin(progress * Math.PI) * 0.3;
        collisionLight.position.set(0, 0, 1.5);
        collisionLight.intensity = Math.sin(progress * Math.PI) * 4;
        const bodyProgress = smoothstep(Math.max(0, (progress - 0.68) / 0.32));
        bodies.forEach((body, index) => {
          body.group.visible = bodyProgress > 0.001;
          body.group.position.copy(initialState[index].position);
          body.group.scale.setScalar(Math.max(0.001, bodyProgress));
          body.material.opacity = bodyProgress;
        });
        if (cycleRef.current) cycleRef.current.textContent = `RECOVERY / ${String(Math.round(progress * 100)).padStart(2, "0")}%`;
        if (progress >= 1) resetSimulation();
      }
    };

    resetSimulation();

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let isVisible = true;
    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerTarget.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    intersectionObserver.observe(canvas);

    let frame;
    let previousTimestamp;
    const animate = (timestamp) => {
      frame = window.requestAnimationFrame(animate);
      if (previousTimestamp === undefined) previousTimestamp = timestamp;
      const rawDelta = Math.min((timestamp - previousTimestamp) * 0.001, 0.04);
      previousTimestamp = timestamp;
      if (!isVisible || document.hidden) return;

      const motionScale = reduceMotion ? 0.22 : 1.45;
      const delta = rawDelta * motionScale;
      runningTime += delta;
      frameCount += 1;
      pointer.lerp(pointerTarget, 0.045);

      if (phase === "orbit") {
        accumulator += delta;
        let substeps = 0;
        while (accumulator >= fixedStep && substeps < 6 && phase === "orbit") {
          const collided = stepGravity(fixedStep);
          accumulator -= fixedStep;
          substeps += 1;
          if (collided) break;
        }
        bodies.forEach((body, index) => {
          body.group.position.copy(bodyStates[index].position);
          body.mesh.rotation.x += delta * (0.11 + index * 0.025);
          body.mesh.rotation.y += delta * (0.18 - index * 0.02);
        });
        if (frameCount % (isCompact ? 2 : 1) === 0) updateTrails();
      } else {
        updateCollisionCycle(delta);
      }

      energyRing.rotation.x = 0.28 + Math.sin(runningTime * 0.11) * 0.08;
      energyRing.rotation.y = 0.35 + runningTime * 0.018;
      energyRing.rotation.z = -0.18 + runningTime * 0.012;
      energyBand.rotation.x = -0.35 + Math.cos(runningTime * 0.09) * 0.1;
      energyBand.rotation.y = 0.2 - runningTime * 0.016;
      energyBand.rotation.z = 0.44 + runningTime * 0.01;
      systemGroup.rotation.y = -0.28 + Math.sin(runningTime * 0.09) * 0.18 + pointer.x * 0.13;
      systemGroup.rotation.x = -0.12 + Math.cos(runningTime * 0.075) * 0.1 - pointer.y * 0.08;
      systemGroup.rotation.z = Math.sin(runningTime * 0.06) * 0.07;
      camera.position.x = Math.sin(runningTime * 0.11) * 0.3 + pointer.x * 0.15;
      camera.position.y = Math.cos(runningTime * 0.085) * 0.18 + pointer.y * -0.11;
      camera.position.z = 7.9 + Math.sin(runningTime * 0.07) * 0.12;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      sceneDisposed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      bodies.forEach((body) => {
        body.geometry.dispose();
        body.material.dispose();
        body.trailGeometry.dispose();
        body.trailMaterial.dispose();
        body.trailPointsMaterial.dispose();
      });
      energyRing.geometry.dispose();
      energyBand.geometry.dispose();
      ringMaterial.dispose();
      bandMaterial.dispose();
      shockwave.geometry.dispose();
      shockwaveMaterial.dispose();
      shardGeometry.dispose();
      shardMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      bennuTexture?.dispose();
      rockTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="asteroid-stage" aria-hidden="true">
      <canvas ref={canvasRef} />
      <span ref={statusRef} className="scene-label scene-label--top">THREE-BODY / CHAOTIC 3D</span>
      <span ref={cycleRef} className="scene-label scene-label--bottom">COLLISION CYCLE / AUTO</span>
    </div>
  );
}
function SectionRail() {
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    let frame;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker = window.scrollY + window.innerHeight * 0.46;
        let current = sectionRailItems[0].id;
        sectionRailItems.forEach((item) => {
          const section = document.getElementById(item.id);
          if (section && section.offsetTop <= marker) current = item.id;
        });
        setActiveSection(current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <nav className="hero-rail" aria-label="页面进度">
    {sectionRailItems.map((item) => <a key={item.id} href={`#${item.id}`} aria-label={`${item.number} ${item.label}`} aria-current={activeSection === item.id ? "location" : undefined} className={activeSection === item.id ? "is-active" : ""}>{item.number}</a>)}
    <ArrowDown size={17} aria-hidden="true" />
  </nav>;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return <header className="site-header">
    <a className="wordmark" href="#top" aria-label="Maple 首页">MAPLE <span aria-hidden="true" /></a>
    <button className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>{menuOpen ? <X size={22} /> : <List size={22} />}</button>
    <nav id="site-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="主导航"><a href="#projects" onClick={close}>作品</a><a href="#about" onClick={close}>关于</a><a href="#notes" onClick={close}>文章</a><a href="#contact" onClick={close}>联系</a></nav>
    <span className="scroll-meter" aria-hidden="true" />
  </header>;
}

function ProjectSection({ project }) {
  return <article className={`project project--${project.align}`} aria-labelledby={`project-${project.id}`}>
    <div className="project__image-wrap"><img src={project.image} alt={`${project.title}项目视觉`} className="project__image" loading={project.id === "01" ? "eager" : "lazy"} /></div>
    <div className="project__copy"><span className="project__number">{project.id}</span><p className="project__kicker">{project.kicker}</p><h3 id={`project-${project.id}`}>{project.title}</h3><p className="project__year">{project.year}</p><p className="project__description">{project.description}</p><a className="text-link" href={`#project-${project.id}`}>查看项目 <ArrowRight size={17} weight="bold" aria-hidden="true" /></a></div>
  </article>;
}

function FeaturedEssayInterlude({ article, onOpenArticle }) {
  return <aside className="featured-note snap-panel" aria-labelledby="featured-note-title">
    <div className="featured-note__meta">
      <p>FEATURED ESSAY / {article.index}</p>
      <span>{article.category}</span>
      <span>{formatArticleDate(article.date)}</span>
      <span>{article.readTime}</span>
    </div>
    <div className="featured-note__content">
      <p className="featured-note__eyebrow">作品之间，换一种速度</p>
      <h3 id="featured-note-title">{article.title}</h3>
      <p>{article.excerpt}</p>
      <button type="button" className="read-button" aria-haspopup="dialog" onClick={() => onOpenArticle(article.id)}>进入阅读模式 <ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
  </aside>;
}

function ProjectArchive({ items }) {
  return <div className="project-archive snap-panel" aria-label="更多项目">
    <div className="project-archive__heading"><p>更多项目 / MORE WORK</p><span>能力的宽度，不需要重复同一种音量。</span></div>
    <div className="project-archive__grid">
      {items.map((project) => <article className="project-card" key={project.id} aria-labelledby={`project-${project.id}`}>
        <div className="project-card__image"><img src={project.image} alt={`${project.title}项目视觉`} loading="lazy" /></div>
        <div className="project-card__copy"><span>{project.id} / {project.year}</span><p>{project.kicker}</p><h3 id={`project-${project.id}`}>{project.title}</h3><p>{project.description}</p><a className="text-link" href={`#project-${project.id}`}>查看项目 <ArrowRight size={16} aria-hidden="true" /></a></div>
      </article>)}
    </div>
  </div>;
}

function ProfileSection() {
  return <section className="profile snap-panel" id="about" aria-labelledby="profile-title">
    <div className="section-heading"><p><span aria-hidden="true" /> 关于我</p><p className="section-heading__meta">PROFILE / STACK / PRACTICE</p></div>
    <div className="profile__body">
      <div className="profile__intro">
        <p className="eyebrow">CREATIVE DEVELOPER / 03</p>
        <h2 id="profile-title">设计是起点，<br />代码让它发生。</h2>
        <p className="profile__summary">我是 Maple，一名关注数字体验的创意开发者。我在视觉设计、前端工程与实时 3D 的交界处工作，把抽象概念变成可以探索、可以感知的网页体验。</p>
        <div className="profile__meta"><span><i aria-hidden="true" />AVAILABLE FOR SELECTED PROJECTS</span><span>BASED IN CHINA</span></div>
      </div>
      <div className="profile__stack">
        <div className="profile__stack-heading"><p>技术栈</p><span>SELECTED STACK / CURRENT PRACTICE</span></div>
        <ol className="profile__stack-list">
          {technologyGroups.map((group) => <li className="profile__stack-item" key={group.index}>
            <span className="profile__stack-index">{group.index}</span>
            <div><p>{group.label}</p><h3>{group.title}</h3><ul>{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></div>
          </li>)}
        </ol>
      </div>
    </div>
  </section>;
}

function NotesSection({ onOpenArticle }) {
  const otherArticles = articles.filter((article) => article.id !== featuredArticle.id);

  return <section className="notes" id="notes" aria-labelledby="notes-title">
    <div className="notes__editorial snap-panel">
      <article className="notes__lead">
        <p className="notes__label">文章与笔记 / ARTICLE {featuredArticle.index}</p>
        <p className="notes__meta">{featuredArticle.category} · {formatArticleDate(featuredArticle.date)} · {featuredArticle.readTime}</p>
        <h3 id="notes-title">{featuredArticle.title}</h3>
        <p>{featuredArticle.excerpt}</p>
        <button type="button" className="read-button" aria-haspopup="dialog" onClick={() => onOpenArticle(featuredArticle.id)}>阅读全文 <ArrowUpRight size={18} aria-hidden="true" /></button>
      </article>
      <div className="notes__index" aria-label="文章索引">
        <p className="notes__index-title">其余文章 / INDEX</p>
        {otherArticles.map((article) => <button className="article-index" type="button" aria-haspopup="dialog" onClick={() => onOpenArticle(article.id)} key={article.id}>
          <span className="article-index__number">{article.index}</span>
          <span className="article-index__copy"><span>{article.category} · {article.readTime}</span><strong>{article.title}</strong><small>{article.excerpt}</small></span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>)}
      </div>
    </div>
  </section>;
}
function ArticleReader({ article, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!article) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...document.querySelectorAll(".article-reader button, .article-reader a")].filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [article, onClose]);

  if (!article) return null;

  let headingCursor = 0;
  const markdownComponents = {
    h2({ children }) {
      const heading = article.headings[headingCursor];
      const number = String(headingCursor + 1).padStart(2, "0");
      headingCursor += 1;
      return <h2 id={heading?.id}><span aria-hidden="true">{number}</span>{children}</h2>;
    },
    a({ href = "", children, ...props }) {
      const isExternal = /^https?:///.test(href);
      return <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} {...props}>{children}</a>;
    },
  };

  const scrollToHeading = (event, headingId) => {
    event.preventDefault();
    document.getElementById(headingId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <div className="article-reader" role="dialog" aria-modal="true" aria-labelledby="reader-title">
    <div className="article-reader__bar">
      <p>MAPLE / FIELD NOTES / {article.index}</p>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭文章"><span>返回主页</span><X size={21} aria-hidden="true" /></button>
    </div>
    <article className="article-reader__document">
      <header className="article-reader__head">
        <p>{article.category}<br />{formatArticleDate(article.date)}<br />{article.readTime}</p>
        <div><span>ARTICLE / {article.index}</span><h2 id="reader-title">{article.title}</h2><p>{article.excerpt}</p></div>
      </header>
      <div className="article-reader__body">
        <aside><span>CONTENTS</span><ol>{article.headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} onClick={(event) => scrollToHeading(event, heading.id)}>{heading.title}</a></li>)}</ol></aside>
        <div className="article-reader__prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{article.body}</ReactMarkdown>
          <footer>END OF ARTICLE / {article.index}</footer>
        </div>
      </div>
    </article>
  </div>;
}

export function App() {
  useScrollProgress();
  const [activeArticleId, setActiveArticleId] = useState(null);
  const activeArticle = articles.find((article) => article.id === activeArticleId) || null;
  useFullPageSnap(!activeArticleId);
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return <main id="top">
    <Header />
    <SectionRail />
    <section className="hero snap-panel" aria-labelledby="hero-title">

      <div className="hero__copy"><p className="eyebrow">MAPLE / PORTFOLIO + NOTES 2026</p><h1 id="hero-title">MAPLE <em>/</em><br />CREATIVE<br />DEVELOPER</h1><p className="hero__statement">设计、代码与数字叙事。<br />我做作品，也记录它们如何发生。</p><p className="availability"><span aria-hidden="true" />AVAILABLE FOR PROJECTS</p><a className="primary-button" href="#projects">查看作品 <ArrowUpRight size={18} weight="bold" aria-hidden="true" /></a><p className="location">BASED IN CHINA<br />© MAPLE 2026</p></div>
      <div className="hero__visual"><AsteroidScene /></div>
    </section>
    <section className="projects" id="projects" aria-labelledby="works-title">
      <div className="project-panel snap-panel">
        <div className="section-heading"><p id="works-title"><span aria-hidden="true" /> 我的项目</p><a href="#contact">VIEW ALL WORKS <ArrowRight size={17} aria-hidden="true" /></a></div>
        <ProjectSection project={projects[0]} />
      </div>
      <FeaturedEssayInterlude article={featuredArticle} onOpenArticle={setActiveArticleId} />
      <div className="project-panel snap-panel"><ProjectSection project={projects[1]} /></div>
      <ProjectArchive items={projects.slice(2)} />
    </section>
    <NotesSection onOpenArticle={setActiveArticleId} />
    <section className="about snap-panel" id="about" aria-labelledby="about-title"><p className="eyebrow">ABOUT / 04</p><div className="about__grid"><h2 id="about-title">让技术有形，<br />让体验有感。</h2><div className="about__copy"><p>我是 Maple，一名关注数字体验的创意开发者。喜欢在设计与代码的交界处工作，把视觉、交互与技术变成同一种表达。</p><p>我关心的不只是页面如何被实现，更在意它如何被看见、理解与记住。</p></div><dl className="about__facts"><div><dt>FOCUS</dt><dd>Creative Development</dd></div><div><dt>TOOLKIT</dt><dd>React / WebGL / Motion</dd></div><div><dt>STATUS</dt><dd>Open for selected projects</dd></div></dl></div></section>
    <section className="contact snap-panel" id="contact" aria-labelledby="contact-title"><p className="eyebrow">CONTACT / 05 / SAY HELLO</p><h2 id="contact-title">一起做点有意思的事 <em>/</em></h2><p>如果你有想法或项目，欢迎随时联系我。</p><div className="contact__links"><a href="mailto:hello@maple.dev"><EnvelopeSimple size={22} aria-hidden="true" />hello@maple.dev</a><a href="https://github.com/Maple127667" target="_blank" rel="noreferrer"><GithubLogo size={22} aria-hidden="true" />Maple127667</a></div><a className="contact__arrow" href="#top" aria-label="返回顶部"><ArrowUpRight size={32} aria-hidden="true" /></a></section>
    <ArticleReader article={activeArticle} onClose={() => setActiveArticleId(null)} />
  </main>;
}
