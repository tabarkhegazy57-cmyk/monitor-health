import "open-anatomy-3d-react/styles.css";
import "./anatomy-theme.css";

import { useGLTF, useProgress } from "@react-three/drei";
import { _roots } from "@react-three/fiber";
import { AlertTriangle } from "lucide-react";
import { modelUrl } from "open-anatomy-3d";
import { AnatomyViewer } from "open-anatomy-3d-react";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { Button } from "@/components/ui/button";
import type { BodyRegionId } from "@/types/domain";

import { regionForStructure, structuresInRegion } from "./anatomy-regions";
import { DEFAULT_VIEW, REGION_VIEWS } from "./camera-presets";
import type { BodyViewerApi, CameraFocus } from "./types";

const MODEL_SEX = "male" as const;
const MODEL_URL = modelUrl(MODEL_SEX);

/** Viewer colours, matched to the app palette (teal primary, mint hover). */
const HOVER_COLOR = "#5cc7b0";
const HIGHLIGHT_COLOR = "#1f9e93";

const MIN_DISTANCE = 0.6;
const MAX_DISTANCE = 6;
const ZOOM_STEP = 1.25;
const TWEEN_MS = 650;
const CLICK_SLOP_PX = 4;

/**
 * Shows the viewer's own layer switches (skin / muscle / organs, as the package
 * defines them) so the internal organs can be revealed. Set to false to hide.
 */
const SHOW_LAYER_TOGGLES = true;

/** The subset of drei's OrbitControls this wrapper drives. */
interface Controls extends THREE.EventDispatcher<{ start: object }> {
  target: THREE.Vector3;
  object: THREE.Camera;
  autoRotate: boolean;
  autoRotateSpeed: number;
  enableZoom: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  update(): boolean;
}

interface Props {
  selected: BodyRegionId | null;
  selectedStructure?: string | null | undefined;
  onSelect: (region: BodyRegionId | null, structure: string | null) => void;
  autoRotate: boolean;
  onApi: (api: BodyViewerApi) => void;
}

export default function BodyScene(props: Props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <ModelErrorBoundary
      key={attempt}
      onRetry={() => {
        useGLTF.clear(MODEL_URL);
        setAttempt((a) => a + 1);
      }}
    >
      <AnatomyStage {...props} />
    </ModelErrorBoundary>
  );
}

function AnatomyStage({ selected, selectedStructure, onSelect, autoRotate, onApi }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<Controls | null>(null);
  const tween = useRef<number | null>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const structureClicked = useRef(false);
  const { active, progress } = useProgress();

  // AnatomyViewer owns its Canvas; reach its OrbitControls through the R3F root.
  useEffect(() => {
    let raf = 0;
    const find = () => {
      const canvas = wrapRef.current?.querySelector("canvas");
      const found = canvas ? (_roots.get(canvas)?.store.getState().controls as Controls | null | undefined) : null;
      if (found) setControls(found);
      else raf = requestAnimationFrame(find);
    };
    find();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!controls) return;
    const c = controls;
    // The package zooms only on Ctrl+wheel; keep the explorer's scroll / pinch zoom.
    c.enableZoom = true;

    const cancel = () => {
      if (tween.current !== null) cancelAnimationFrame(tween.current);
      tween.current = null;
    };
    const current = () => new THREE.Spherical().setFromVector3(c.object.position.clone().sub(c.target));
    const animateTo = (target: THREE.Vector3, to: THREE.Spherical) => {
      cancel();
      const fromTarget = c.target.clone();
      const from = current();
      const dTheta = Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta));
      const start = performance.now();
      const step = (now: number) => {
        const k = Math.min((now - start) / TWEEN_MS, 1);
        const e = 1 - Math.pow(1 - k, 3);
        c.target.lerpVectors(fromTarget, target, e);
        const s = new THREE.Spherical(
          THREE.MathUtils.lerp(from.radius, to.radius, e),
          THREE.MathUtils.lerp(from.phi, to.phi, e),
          from.theta + dTheta * e,
        );
        c.object.position.setFromSpherical(s).add(c.target);
        c.update();
        tween.current = k < 1 ? requestAnimationFrame(step) : null;
      };
      tween.current = requestAnimationFrame(step);
    };
    const toView = (v: CameraFocus) => {
      const target = new THREE.Vector3(...v.target);
      animateTo(target, new THREE.Spherical().setFromVector3(new THREE.Vector3(...v.position).sub(target)));
    };
    const zoom = (factor: number) => {
      const s = current();
      s.radius = THREE.MathUtils.clamp(s.radius * factor, MIN_DISTANCE, MAX_DISTANCE);
      animateTo(c.target.clone(), s);
    };

    c.addEventListener("start", cancel);
    onApi({
      zoomIn: () => zoom(1 / ZOOM_STEP),
      zoomOut: () => zoom(ZOOM_STEP),
      rotate: (d) => {
        const s = current();
        s.theta += d * (Math.PI / 4);
        animateTo(c.target.clone(), s);
      },
      reset: () => toView(DEFAULT_VIEW),
      focus: (id) => toView(id ? REGION_VIEWS[id] : DEFAULT_VIEW),
    });
    return () => {
      c.removeEventListener("start", cancel);
      cancel();
    };
  }, [controls, onApi]);

  // Presentation-quality rendering: filmic tone mapping, sharper pixel ratio,
  // soft studio lighting (key + fill + rim) and inertial orbit damping.
  useEffect(() => {
    if (!controls) return;
    const canvas = wrapRef.current?.querySelector("canvas");
    const root = canvas ? _roots.get(canvas) : undefined;
    if (!root) return;
    const state = root.store.getState();
    const { gl, scene } = state;

    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach((x) => (x.needsUpdate = true));
      else if (m) m.needsUpdate = true;
    });

    const hemi = new THREE.HemisphereLight("#ffffff", "#9fb8c4", 0.7);
    const key = new THREE.DirectionalLight("#fff4e8", 1.6);
    key.position.set(2.5, 3.2, 3.5);
    const fill = new THREE.DirectionalLight("#cfe8ff", 0.6);
    fill.position.set(-3, 1.5, 2);
    const rim = new THREE.DirectionalLight("#7fe3d2", 0.9);
    rim.position.set(0, 2.5, -3.5);
    const rig = [hemi, key, fill, rim];
    rig.forEach((l) => scene.add(l));

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    state.invalidate();

    return () => {
      rig.forEach((l) => {
        scene.remove(l);
        l.dispose();
      });
    };
  }, [controls]);

  useEffect(() => {
    if (!controls) return;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
  }, [controls, autoRotate]);

  const highlightedKeys = useMemo(
    () => (selectedStructure ? [selectedStructure] : selected ? [...structuresInRegion(selected)] : []),
    [selected, selectedStructure],
  );

  const handleStructureClick = useCallback(
    (key: string) => {
      structureClicked.current = true;
      const region = regionForStructure(key);
      if (region) onSelect(region, key);
    },
    [onSelect],
  );

  const ready = controls !== null && !active && progress === 100;

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0"
      data-scene-ready={ready ? "true" : undefined}
      aria-label="Interactive 3D anatomical body model"
      onPointerDown={(e) => {
        pointerDown.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        // A click on empty space (not a structure, not a drag) clears the selection.
        const hitStructure = structureClicked.current;
        structureClicked.current = false;
        if (hitStructure || !(e.target instanceof HTMLCanvasElement)) return;
        const p = pointerDown.current;
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > CLICK_SLOP_PX) return;
        onSelect(null, null);
      }}
    >
      <AnatomyViewer
        className="astra-anatomy"
        defaultSex={MODEL_SEX}
        highlightedKeys={highlightedKeys}
        onStructureClick={handleStructureClick}
        hoverHint="Click to see linked readings"
        hoverColor={HOVER_COLOR}
        highlightColor={HIGHLIGHT_COLOR}
        showSexToggle={false}
        showLayerToggles={SHOW_LAYER_TOGGLES}
        showRotateControl={false}
        showZoomControls={false}
      />
    </div>
  );
}

class ModelErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("3D anatomy model failed to load", error);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="absolute inset-0 grid place-items-center p-6">
        <div className="max-w-xs rounded-lg border bg-card p-5 text-center shadow-raised">
          <span className="mx-auto grid size-10 place-items-center rounded-full bg-coral-soft text-coral-ink">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <h3 className="mt-3 text-sm font-semibold">The 3D model couldn't load</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Check your connection and try again. The region buttons and readings below still work.
          </p>
          <Button size="sm" className="mt-4" onClick={this.props.onRetry}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
