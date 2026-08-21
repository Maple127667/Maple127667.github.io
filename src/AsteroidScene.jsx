import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { createSeededRandom, normalizeSimulationSeed, seedToUint32 } from "./seededRandom.js";
import { useLocale } from "./i18n.jsx";

const BENNU_MODEL_URL = `${import.meta.env.BASE_URL}assets/models/bennu.glb`;
const BENNU_MODEL_BYTES = 859980;
const BENNU_LOAD_TIMEOUT_MS = 6000;
const bennuProgressListeners = new Set();
let bennuAssetPromise;
let bennuAssetSettled = false;

function disposeImportedScene(root, disposeTextures = false, preservedTexture = null) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (!material) return;
      if (disposeTextures) {
        Object.values(material).forEach((value) => {
          if (value?.isTexture && value !== preservedTexture) value.dispose();
        });
      }
      material.dispose();
    });
  });
}

function normalizeBennuAsset(gltf) {
  gltf.scene.updateMatrixWorld(true);
  const sourceMesh = gltf.scene.getObjectByProperty("isMesh", true);
  if (!sourceMesh) throw new Error("Bennu model does not contain a mesh");

  const geometry = sourceMesh.geometry.clone();
  geometry.applyMatrix4(sourceMesh.matrixWorld);
  geometry.center();
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const sourceRadius = geometry.boundingSphere?.radius || 1;
  geometry.scale(1 / sourceRadius, 1 / sourceRadius, 1 / sourceRadius);
  geometry.computeBoundingSphere();

  const sourceMaterials = Array.isArray(sourceMesh.material) ? sourceMesh.material : [sourceMesh.material];
  const texture = sourceMaterials.find((material) => material?.map)?.map || null;
  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }
  disposeImportedScene(gltf.scene, true, texture);
  return { mode: "bennu", geometry, texture };
}

export function preloadAsteroidAssets(onProgress) {
  if (onProgress && !bennuAssetSettled) bennuProgressListeners.add(onProgress);

  if (!bennuAssetPromise) {
    bennuAssetPromise = new Promise((resolve) => {
      const loader = new GLTFLoader();
      let settled = false;
      const settle = (asset) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(asset);
      };
      const timeout = window.setTimeout(() => {
        settle({ mode: "fallback", reason: "timeout" });
      }, BENNU_LOAD_TIMEOUT_MS);

      loader.load(
        BENNU_MODEL_URL,
        (gltf) => {
          if (settled) {
            disposeImportedScene(gltf.scene, true);
            return;
          }
          try {
            settle(normalizeBennuAsset(gltf));
          } catch (error) {
            disposeImportedScene(gltf.scene, true);
            settle({ mode: "fallback", reason: "parse", error });
          }
        },
        (event) => {
          const total = Number(event.total) || BENNU_MODEL_BYTES;
          const ratio = Math.min(1, event.loaded / total);
          bennuProgressListeners.forEach((listener) => listener({ loaded: event.loaded, total, ratio }));
        },
        (error) => settle({ mode: "fallback", reason: "network", error }),
      );
    }).finally(() => {
      bennuAssetSettled = true;
      bennuProgressListeners.clear();
    });
  }

  return bennuAssetPromise;
}

export default function AsteroidScene({ onProgress, onReady, suspended = false }) {
  const { copy } = useLocale();
  const copyRef = useRef(copy);
  copyRef.current = copy;
  const canvasRef = useRef(null);
  const seedLabelRef = useRef(null);
  const seedTriggerRef = useRef(null);
  const seedInputRef = useRef(null);
  const cycleRef = useRef(null);
  const applySeedRef = useRef(null);
  const currentSeedRef = useRef("");
  const onProgressRef = useRef(onProgress);
  const onReadyRef = useRef(onReady);
  const suspendedRef = useRef(suspended);
  const syncAnimationRef = useRef(() => {});
  const [seedEditorOpen, setSeedEditorOpen] = useState(false);
  const [seedInput, setSeedInput] = useState("");

  useEffect(() => {
    onProgressRef.current = onProgress;
    onReadyRef.current = onReady;
  }, [onProgress, onReady]);

  useEffect(() => {
    suspendedRef.current = suspended;
    syncAnimationRef.current();
  }, [suspended]);

  const openSeedEditor = () => {
    setSeedInput(currentSeedRef.current);
    setSeedEditorOpen(true);
  };

  const closeSeedEditor = () => {
    setSeedEditorOpen(false);
    window.requestAnimationFrame(() => seedTriggerRef.current?.focus());
  };

  const submitSeed = (event) => {
    event.preventDefault();
    const normalizedSeed = normalizeSimulationSeed(seedInput);
    if (!normalizedSeed) return;
    applySeedRef.current?.(normalizedSeed);
    setSeedInput(normalizedSeed);
    setSeedEditorOpen(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCompact = window.innerWidth < 720;
    const BACKGROUND_LAYER = 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0.15, 0.04, 7.9);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      canvas.dataset.asteroidModel = "webgl-fallback";
      canvas.dataset.sceneReady = "fallback";
      onProgressRef.current?.({ progress: 1, status: "SCENE READY / COMPATIBILITY MODE" });
      onReadyRef.current?.({ mode: "fallback", error });
      return undefined;
    }
    onProgressRef.current?.({ progress: 0.18, status: "WARMING WEBGL RENDERER" });
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.3 : 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.autoClear = false;

    const bennuAssetReady = preloadAsteroidAssets(({ ratio }) => {
      onProgressRef.current?.({
        progress: ratio === null ? 0.22 : 0.22 + ratio * 0.58,
        status: "LOADING BENNU MODEL",
      });
    });

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

    const createRandomSeedLabel = () => {
      if (window.crypto?.getRandomValues) {
        const value = new Uint32Array(1);
        window.crypto.getRandomValues(value);
        return value[0].toString(36).toUpperCase().padStart(7, "0").slice(-7);
      }
      return seedToUint32(`${Date.now()}:${window.performance.now()}`)
        .toString(36)
        .toUpperCase()
        .padStart(7, "0")
        .slice(-7);
    };

    const requestedSeed = normalizeSimulationSeed(new URLSearchParams(window.location.search).get("seed"));
    let activeSeed = requestedSeed || createRandomSeedLabel();
    let cycleNumber = 0;
    let cycleSeed = 0;
    let cycleRandom = createSeededRandom(`${activeSeed}:0`);
    currentSeedRef.current = activeSeed;

    const randomValue = () => cycleRandom();

    const randomUnitVector = () => {
      const z = randomValue() * 2 - 1;
      const angle = randomValue() * Math.PI * 2;
      const radius = Math.sqrt(Math.max(0, 1 - z * z));
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    };

    const randomizeMomentum = () => {
      cycleNumber += 1;
      const cycleKey = `${activeSeed}:${cycleNumber}`;
      cycleRandom = createSeededRandom(cycleKey);
      cycleSeed = (seedToUint32(cycleKey) / 4294967296) * 10000;
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
      canvas.dataset.seed = activeSeed;
      canvas.dataset.seedCycle = `${activeSeed}:${cycleNumber}`;
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
    let preparedMode = null;
    let readyReported = false;
    const renderSceneFrame = () => {
      renderer.clear(true, true, true);
      camera.layers.set(BACKGROUND_LAYER);
      renderer.render(scene, camera);
      renderer.clearDepth();
      camera.layers.set(0);
      renderer.render(scene, camera);
    };
    const reportSceneReady = () => {
      if (!preparedMode || readyReported || sceneDisposed) return;
      readyReported = true;
      canvas.dataset.sceneReady = preparedMode;
      onProgressRef.current?.({
        progress: 1,
        status: preparedMode === "bennu" ? "SPACE SCENE READY" : "SCENE READY / COMPATIBILITY MODE",
      });
      onReadyRef.current?.({ mode: preparedMode });
    };
    const modelTints = [0xc5d2dc, 0xa8bac8, 0xd6dfe5];
    bennuAssetReady.then((asset) => {
      if (sceneDisposed) return;
      if (asset.mode === "bennu") {
        if (asset.texture) {
          asset.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          asset.texture.needsUpdate = true;
        }
        const replacementGeometry = asset.geometry.clone();
        bodies.forEach((body, index) => {
          const previousGeometry = body.geometry;
          body.geometry = replacementGeometry;
          body.mesh.geometry = replacementGeometry;
          body.mesh.scale.setScalar(initialState[index].radius);
          body.material.color.setHex(modelTints[index]);
          body.material.emissive.copy(body.material.color).multiplyScalar(0.085);
          body.material.emissiveIntensity = 0.72;
          body.material.roughness = 0.9;
          body.material.metalness = 0.02;
          body.material.flatShading = false;
          if (asset.texture) body.material.map = asset.texture;
          body.material.bumpMap = rockTexture;
          body.material.bumpScale = 0.075;
          body.material.needsUpdate = true;
          previousGeometry.dispose();
        });
        canvas.dataset.asteroidModel = "nasa-bennu";
      } else {
        canvas.dataset.asteroidModel = "procedural-fallback";
      }
      preparedMode = asset.mode;
      onProgressRef.current?.({ progress: 0.92, status: "COMPILING SPACE SCENE" });
      try {
        resize();
        renderSceneFrame();
      } catch (error) {
        preparedMode = "fallback";
        canvas.dataset.asteroidModel = "webgl-fallback";
        canvas.dataset.sceneError = error instanceof Error ? error.name : "render-error";
      }
      reportSceneReady();
    });
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
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const energyRing = new THREE.Points(createFieldGeometry(isCompact ? 54 : 92, 2.74, 0.8), ringMaterial);
    energyRing.rotation.set(0.28, 0.35, -0.18);
    energyRing.renderOrder = -10;
    energyRing.layers.set(BACKGROUND_LAYER);
    systemGroup.add(energyRing);

    const bandMaterial = new THREE.PointsMaterial({
      color: 0x405d78,
      size: 0.012,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const energyBand = new THREE.Points(createFieldGeometry(isCompact ? 28 : 46, 3.3, 2.4), bandMaterial);
    energyBand.rotation.set(-0.35, 0.2, 0.44);
    energyBand.renderOrder = -20;
    energyBand.layers.set(BACKGROUND_LAYER);
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
      depthTest: false,
      depthWrite: false,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.renderOrder = -30;
    stars.layers.set(BACKGROUND_LAYER);
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

    const updateSeedLabel = () => {
      const displaySeed = activeSeed.length > 18 ? `${activeSeed.slice(0, 17)}…` : activeSeed;
      currentSeedRef.current = activeSeed;
      if (seedLabelRef.current) seedLabelRef.current.textContent = `SEEDS / ${displaySeed}`;
      if (seedTriggerRef.current) {
        seedTriggerRef.current.setAttribute("aria-label", copyRef.current.seed.triggerAria(activeSeed));
      }
    };

    const setSceneStatus = (label, alert = false) => {
      if (!cycleRef.current) return;
      cycleRef.current.textContent = label;
      cycleRef.current.style.color = alert ? "#c8ff23" : "";
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
      resetTrails();
      updateSeedLabel();
      setSceneStatus(
        reduceMotion
          ? `REDUCED MOTION / CYCLE ${String(cycleNumber).padStart(2, "0")}`
          : `CHAOTIC 3D / CYCLE ${String(cycleNumber).padStart(2, "0")}`,
      );
    };

    applySeedRef.current = (nextSeed) => {
      activeSeed = normalizeSimulationSeed(nextSeed) || createRandomSeedLabel();
      cycleNumber = 0;
      const url = new URL(window.location.href);
      url.searchParams.set("seed", activeSeed);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      resetSimulation();
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

      setSceneStatus("COLLISION / FRACTURE", true);
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
        if (progress >= 1) {
          phase = "hold";
          phaseTime = 0;
          bodies.forEach((body) => { body.group.visible = false; });
          setSceneStatus("DEBRIS FIELD / UNSTABLE", true);
        }
        return;
      }

      if (phase === "hold") {
        const progress = Math.min(phaseTime / 0.18, 1);
        shockwaveMaterial.opacity = 0;
        collisionLight.intensity = 0;
        if (progress >= 1) {
          phase = "reassemble";
          phaseTime = 0;
          setSceneStatus("REASSEMBLING / MAGNETIC", true);
        }
        return;
      }

      if (phase === "reassemble") {
        const progress = Math.min(phaseTime / 1.35, 1);
        updateShardMatrices("reassemble", progress);
        shardMaterial.opacity = 1 - smoothstep(Math.max(0, (progress - 0.72) / 0.28));
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
    let cameraDistance = 8.9;
    let isVisible = false;
    let syncAnimation = () => {};
    const sceneFocusHost = canvas.closest(".opening-stage");
    const storedSceneFocus = sceneFocusHost?.dataset.portfolioSceneFocus;
    let requestedVisibleFocusX = storedSceneFocus === undefined
      ? null
      : Number(storedSceneFocus);
    if (!Number.isFinite(requestedVisibleFocusX)) requestedVisibleFocusX = null;
    let viewWidth = 0;
    let viewHeight = 0;
    const onPointerMove = (event) => {
      if (reduceMotion || event.pointerType === "touch") return;
      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      pointerTarget.x = THREE.MathUtils.clamp((event.clientX / viewportWidth - 0.5) * 2, -1, 1);
      pointerTarget.y = THREE.MathUtils.clamp((event.clientY / viewportHeight - 0.5) * 2, -1, 1);
    };
    const onPointerLeave = () => pointerTarget.set(0, 0);
    const pointerMoveOptions = { passive: true };
    window.addEventListener("pointermove", onPointerMove, pointerMoveOptions);
    window.addEventListener("blur", onPointerLeave);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const applyCameraViewOffset = () => {
      if (!viewWidth || !viewHeight) return;
      const viewportWidth = window.innerWidth;
      const baselineFocusX = viewportWidth <= 760 ? 0.66 : viewportWidth <= 1080 ? 0.5 : 0.68;
      const visibleFocusX = viewportWidth > 1080 && requestedVisibleFocusX !== null
        ? THREE.MathUtils.clamp(requestedVisibleFocusX, 0.42, 0.76)
        : baselineFocusX;
      const focusY = viewportWidth <= 760 ? 0.75 : 0.535;
      const visibleWidth = Math.min(viewportWidth, viewWidth);
      const horizontalOverscan = Math.max(0, (viewWidth - visibleWidth) * 0.5);
      const focusX = (horizontalOverscan + visibleFocusX * visibleWidth) / viewWidth;
      camera.setViewOffset(
        viewWidth,
        viewHeight,
        (0.5 - focusX) * viewWidth,
        (0.5 - focusY) * viewHeight,
        viewWidth,
        viewHeight,
      );
      canvas.dataset.sceneFocus = `${Math.round(visibleFocusX * 100)}%,${Math.round(focusY * 100)}%`;
      camera.updateProjectionMatrix();
    };

    const onPortfolioSceneFocus = (event) => {
      const nextFocus = event.detail?.focusX;
      requestedVisibleFocusX = nextFocus === null || nextFocus === undefined
        ? null
        : Number(nextFocus);
      if (!Number.isFinite(requestedVisibleFocusX)) requestedVisibleFocusX = null;
      applyCameraViewOffset();
    };
    sceneFocusHost?.addEventListener("portfolio:scene-focus", onPortfolioSceneFocus);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) {
        syncAnimation();
        return;
      }
      viewWidth = width;
      viewHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const viewportWidth = window.innerWidth;
      const previousVisualHeight = viewportWidth <= 760
        ? height * 0.858
        : Math.max(1, height - 176) * 1.1;
      cameraDistance = viewportWidth <= 760
        ? 9.2
        : THREE.MathUtils.clamp(7.9 * (height / previousVisualHeight), 8.6, 9.5);
      applyCameraViewOffset();
      syncAnimation();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncAnimation();
    });
    intersectionObserver.observe(canvas);

    let frame;
    let previousTimestamp;
    const stopAnimation = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      previousTimestamp = undefined;
    };
    const shouldAnimate = () => (
      !sceneDisposed
      && !suspendedRef.current
      && isVisible
      && !document.hidden
    );
    const animate = (timestamp) => {
      frame = undefined;
      if (!shouldAnimate()) {
        previousTimestamp = undefined;
        return;
      }
      frame = window.requestAnimationFrame(animate);
      if (previousTimestamp === undefined) previousTimestamp = timestamp;
      const rawDelta = Math.min((timestamp - previousTimestamp) * 0.001, 0.04);
      previousTimestamp = timestamp;

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
      systemGroup.rotation.y = -0.28 + Math.sin(runningTime * 0.09) * 0.18 + pointer.x * 0.24;
      systemGroup.rotation.x = -0.12 + Math.cos(runningTime * 0.075) * 0.1 - pointer.y * 0.16;
      systemGroup.rotation.z = Math.sin(runningTime * 0.06) * 0.07;
      camera.position.x = Math.sin(runningTime * 0.11) * 0.3 + pointer.x * 0.42;
      camera.position.y = Math.cos(runningTime * 0.085) * 0.18 + pointer.y * -0.3;
      camera.position.z = cameraDistance + Math.sin(runningTime * 0.07) * 0.12;
      camera.lookAt(0, 0, 0);
      renderSceneFrame();
      reportSceneReady();
    };
    syncAnimation = () => {
      if (!shouldAnimate()) {
        stopAnimation();
        return;
      }
      if (frame === undefined) frame = window.requestAnimationFrame(animate);
    };
    const onVisibilityChange = () => syncAnimation();
    document.addEventListener("visibilitychange", onVisibilityChange);
    syncAnimationRef.current = syncAnimation;
    syncAnimation();

    return () => {
      sceneDisposed = true;
      applySeedRef.current = null;
      syncAnimationRef.current = () => {};
      stopAnimation();
      window.removeEventListener("pointermove", onPointerMove, pointerMoveOptions);
      window.removeEventListener("blur", onPointerLeave);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sceneFocusHost?.removeEventListener("portfolio:scene-focus", onPortfolioSceneFocus);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      const bodyGeometries = new Set(bodies.map((body) => body.geometry));
      bodyGeometries.forEach((geometry) => geometry.dispose());
      bodies.forEach((body) => {
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
      rockTexture.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!seedEditorOpen) return;
    seedInputRef.current?.focus();
    seedInputRef.current?.select();
  }, [seedEditorOpen]);

  return (
    <div className="asteroid-stage">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="seed-control scene-label scene-label--top">
        <button
          ref={seedTriggerRef}
          className="seed-control__trigger"
          type="button"
          aria-expanded={seedEditorOpen}
          aria-controls="three-body-seed-editor"
          onClick={seedEditorOpen ? closeSeedEditor : openSeedEditor}
        >
          <span ref={seedLabelRef} aria-live="polite">SEEDS / INITIALIZING</span>
        </button>
        {seedEditorOpen && <form id="three-body-seed-editor" className="seed-control__editor" onSubmit={submitSeed}>
          <input
            ref={seedInputRef}
            value={seedInput}
            maxLength={32}
            autoComplete="off"
            spellCheck="false"
            aria-label={copy.seed.inputAria}
            placeholder="ENTER SEED"
            onChange={(event) => setSeedInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              closeSeedEditor();
            }}
          />
          <button type="submit">SET</button>
        </form>}
      </div>
      <span ref={cycleRef} className="scene-label scene-label--bottom" aria-hidden="true">CHAOTIC 3D / INITIALIZING</span>
    </div>
  );
}
