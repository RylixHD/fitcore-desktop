import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ExerciseAnimation } from "./animation-assets";
/** Reusable viewer; no synthetic animation is created if a genuine clip is absent. */
export default function ExerciseViewer({
  asset,
}: {
  asset: ExerciseAnimation;
}) {
  const host = useRef<HTMLDivElement>(null),
    mixerRef = useRef<THREE.AnimationMixer | null>(null),
    cameraRef = useRef<THREE.PerspectiveCamera | null>(null),
    controlsRef = useRef<OrbitControls | null>(null);
  const [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(1);
  useEffect(() => {
    if (mixerRef.current) mixerRef.current.timeScale = paused ? 0 : speed;
  }, [paused, speed]);
  useEffect(() => {
    let disposed = false,
      frame = 0,
      renderer: THREE.WebGLRenderer | undefined,
      model: THREE.Object3D | undefined;
    const container = host.current!;
    setError("");
    setReady(false);
    setPaused(false);
    setSpeed(1);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#151b18");
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    camera.position.set(2, 1.5, 3);
    cameraRef.current = camera;
    const disposeModel = (root: THREE.Object3D) =>
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          for (const material of materials) {
            for (const value of Object.values(material))
              if (value instanceof THREE.Texture) value.dispose();
            material.dispose();
          }
        }
      });
    let observer: ResizeObserver | undefined;
    try {
      if (!asset.license || !asset.reviewedBy || !asset.clip)
        throw Error("Animasyon inceleme veya lisans bilgisi eksik.");
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.target.set(0, 1, 0);
      controlsRef.current = controls;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x526052, 2));
      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(3, 5, 4);
      scene.add(light);
      const manager = new THREE.LoadingManager();
      const base = new URL(asset.url, window.location.href);
      if (base.protocol !== "file:" || !base.pathname.endsWith(".glb"))
        throw Error("Yalnızca paket içindeki GLB dosyaları desteklenir.");
      manager.setURLModifier((url) => {
        if (url.startsWith("blob:") || url.startsWith("data:")) return url;
        if (new URL(url, base).href !== base.href)
          throw Error("GLB dış kaynak içeremez.");
        return url;
      });
      new GLTFLoader(manager).load(
        base.href,
        (gltf) => {
          if (disposed) {
            disposeModel(gltf.scene);
            return;
          }
          const clip = gltf.animations.find((x) => x.name === asset.clip);
          if (!clip) {
            disposeModel(gltf.scene);
            setError("Bu dosyada tanımlı hareket animasyonu bulunamadı.");
            return;
          }
          model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model),
            size = box.getSize(new THREE.Vector3()),
            center = box.getCenter(new THREE.Vector3());
          const scale = 2 / Math.max(size.x, size.y, size.z);
          model.scale.setScalar(scale);
          model.position.copy(center.multiplyScalar(-scale));
          model.position.y += 1;
          scene.add(model);
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          mixer.clipAction(clip).play();
          setReady(true);
        },
        undefined,
        () => {
          if (!disposed)
            setError(
              "Animasyon yüklenemedi. Paket varlığı veya WebGL desteğini kontrol et.",
            );
        },
      );
      observer = new ResizeObserver(() => {
        const width = container.clientWidth || 600;
        renderer!.setSize(width, 360);
        camera.aspect = width / 360;
        camera.updateProjectionMatrix();
      });
      observer.observe(container);
      const clock = new THREE.Clock();
      const render = () => {
        if (disposed) return;
        frame = requestAnimationFrame(render);
        mixerRef.current?.update(Math.min(clock.getDelta(), 0.1));
        controls.update();
        renderer!.render(scene, camera);
      };
      render();
    } catch (e) {
      setError(String(e));
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      controlsRef.current?.dispose();
      controlsRef.current = null;
      if (model) disposeModel(model);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [asset]);
  return (
    <div>
      <div
        ref={host}
        aria-label="Döndürülebilir 3D egzersiz sahnesi"
        style={{ height: 360, borderRadius: 12, overflow: "hidden" }}
      />
      {error ? (
        <p role="alert">{error}</p>
      ) : !ready ? (
        <p>Animasyon yükleniyor…</p>
      ) : (
        <div className="actions wrap">
          <button onClick={() => setPaused(!paused)}>
            {paused ? "Oynat" : "Duraklat"}
          </button>
          <label>
            Hız{" "}
            <select
              aria-label="Animasyon hızı"
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
            >
              {[0.25, 0.5, 1, 1.5].map((x) => (
                <option key={x} value={x}>
                  {x}×
                </option>
              ))}
            </select>
          </label>
          {["Ön", "Yan", "Arka"].map((x, i) => (
            <button
              key={x}
              onClick={() => {
                cameraRef.current?.position.set(
                  ...([
                    [0, 1.5, 4],
                    [4, 1.5, 0],
                    [0, 1.5, -4],
                  ][i] as [number, number, number]),
                );
                controlsRef.current?.update();
              }}
            >
              {x}
            </button>
          ))}
        </div>
      )}
      <p>
        Fareyle döndür · Tekerlekle yakınlaştır · Lisans: {asset.license} · Form
        incelemesi: {asset.reviewedBy}
      </p>
    </div>
  );
}
