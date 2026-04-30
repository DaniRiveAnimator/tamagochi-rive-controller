import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceColor,
  useViewModelInstanceNumber,
  useViewModelInstanceTrigger,
} from "@rive-app/react-webgl2";
import { Heart, Minus, Palette, Play, Plus, RotateCcw } from "lucide-react";

const RIVE_SRC = `${import.meta.env.BASE_URL}tamagochi.riv`;
const CONTROL_COOLDOWN_MS = 320;
const TRIGGERS = [
  "death",
  "zombie",
  "revive",
  "calmBreathingJogging",
  "slumpedToDeath",
  "slumpedOnBed",
  "lyingOnSofa",
  "slowBreathingSit",
  "anxiousBreathing",
  "sweepingStare",
  "sittingGiggle",
] as const;

const HEALTH_COLORS = [
  { label: "Mint", value: [104, 190, 132] },
  { label: "Gold", value: [242, 198, 109] },
  { label: "Coral", value: [255, 137, 125] },
] as const;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export function App() {
  const [environment, setEnvironment] = useState(0);
  const [health, setHealth] = useState(0.7);
  const [activeColor, setActiveColor] = useState(0);
  const [controlsLocked, setControlsLocked] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);

  const layout = useMemo(() => new Layout({ fit: Fit.Contain }), []);

  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    artboard: "MAIN",
    stateMachines: "Interaction",
    autoplay: true,
    autoBind: false,
    layout,
  });

  const viewModel = useViewModel(rive, { name: "MainVM" });
  const viewModelInstance = useViewModelInstance(viewModel, { rive, useDefault: true });
  const environmentProperty = useViewModelInstanceNumber("environment", viewModelInstance);
  const healthProperty = useViewModelInstanceNumber("healthbar", viewModelInstance);
  const nestedHealthProperty = useViewModelInstanceNumber("propertyOfhealthBar/numberProperty", viewModelInstance);
  const colorHealthbar = useViewModelInstanceColor("colorHealthbar", viewModelInstance);
  const deathTrigger = useViewModelInstanceTrigger("death", viewModelInstance);
  const zombieTrigger = useViewModelInstanceTrigger("zombie", viewModelInstance);
  const reviveTrigger = useViewModelInstanceTrigger("revive", viewModelInstance);
  const calmBreathingJoggingTrigger = useViewModelInstanceTrigger("calmBreathingJogging", viewModelInstance);
  const slumpedToDeathTrigger = useViewModelInstanceTrigger("slumpedToDeath", viewModelInstance);
  const slumpedOnBedTrigger = useViewModelInstanceTrigger("slumpedOnBed", viewModelInstance);
  const lyingOnSofaTrigger = useViewModelInstanceTrigger("lyingOnSofa", viewModelInstance);
  const slowBreathingSitTrigger = useViewModelInstanceTrigger("slowBreathingSit", viewModelInstance);
  const anxiousBreathingTrigger = useViewModelInstanceTrigger("anxiousBreathing", viewModelInstance);
  const sweepingStareTrigger = useViewModelInstanceTrigger("sweepingStare", viewModelInstance);
  const sittingGiggleTrigger = useViewModelInstanceTrigger("sittingGiggle", viewModelInstance);

  const triggerActions = useMemo(
    () => ({
      death: deathTrigger.trigger,
      zombie: zombieTrigger.trigger,
      revive: reviveTrigger.trigger,
      calmBreathingJogging: calmBreathingJoggingTrigger.trigger,
      slumpedToDeath: slumpedToDeathTrigger.trigger,
      slumpedOnBed: slumpedOnBedTrigger.trigger,
      lyingOnSofa: lyingOnSofaTrigger.trigger,
      slowBreathingSit: slowBreathingSitTrigger.trigger,
      anxiousBreathing: anxiousBreathingTrigger.trigger,
      sweepingStare: sweepingStareTrigger.trigger,
      sittingGiggle: sittingGiggleTrigger.trigger,
    }),
    [
      anxiousBreathingTrigger.trigger,
      calmBreathingJoggingTrigger.trigger,
      deathTrigger.trigger,
      lyingOnSofaTrigger.trigger,
      reviveTrigger.trigger,
      sittingGiggleTrigger.trigger,
      slowBreathingSitTrigger.trigger,
      slumpedOnBedTrigger.trigger,
      slumpedToDeathTrigger.trigger,
      sweepingStareTrigger.trigger,
      zombieTrigger.trigger,
    ],
  );

  const startControlsCooldown = useCallback(() => {
    setControlsLocked(true);
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = window.setTimeout(() => {
      setControlsLocked(false);
      cooldownTimerRef.current = null;
    }, CONTROL_COOLDOWN_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    environmentProperty.setValue?.(environment);
  }, [environment, environmentProperty]);

  useEffect(() => {
    healthProperty.setValue?.(health);
    nestedHealthProperty.setValue?.(health);
  }, [health, healthProperty, nestedHealthProperty]);

  useEffect(() => {
    const [red, green, blue] = HEALTH_COLORS[activeColor].value;
    colorHealthbar.setRgb(red, green, blue);
  }, [activeColor, colorHealthbar]);

  const nudgeEnvironment = (step: number) => {
    startControlsCooldown();
    setEnvironment((current) => clamp(current + step, 0, 4));
  };

  const fireAction = (action: () => void) => {
    startControlsCooldown();
    action();
  };

  const resetPet = () => {
    startControlsCooldown();
    setEnvironment(0);
    setHealth(0.7);
    setActiveColor(0);
    reviveTrigger.trigger();
  };

  const canLowerEnvironment = environment > 0 && !controlsLocked;
  const canRaiseEnvironment = environment < 4 && !controlsLocked;

  return (
    <main className="app-shell">
      <section className="stage" aria-label="Tamagochi Rive controller">
        <div className="title-bar">
          <div>
            <p className="eyebrow">Rive companion</p>
            <h1>Tamagochi</h1>
          </div>
          <button className="icon-button" type="button" onClick={resetPet} disabled={controlsLocked} aria-label="Reset controls">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="content-grid">
          <aside className="control-rail left-rail" aria-label="Environment controls">
            <ControlButton label="Previous environment" onClick={() => nudgeEnvironment(-1)} disabled={!canLowerEnvironment}>
              <Minus size={22} />
            </ControlButton>
            <div className="readout">
              <span>environment</span>
              <strong>{environment}</strong>
            </div>
            <ControlButton label="Next environment" onClick={() => nudgeEnvironment(1)} disabled={!canRaiseEnvironment}>
              <Plus size={22} />
            </ControlButton>
          </aside>

          <div className="rive-frame">
            <RiveComponent className="rive-canvas" />
            <div className="load-chip" aria-live="polite">
              {rive ? "loaded" : "loading"}
            </div>
          </div>

          <aside className="binding-panel" aria-label="All Rive bindings">
            <div className="binding-list" aria-label="Scrollable Rive input list">
              <BindingRow label="environment" type="Number">
                <div className="stepper">
                  <button type="button" aria-label="Decrease environment" onClick={() => nudgeEnvironment(-1)} disabled={!canLowerEnvironment}>
                    <Minus size={16} />
                  </button>
                  <strong>{environment}</strong>
                  <button type="button" aria-label="Increase environment" onClick={() => nudgeEnvironment(1)} disabled={!canRaiseEnvironment}>
                    <Plus size={16} />
                  </button>
                </div>
              </BindingRow>

              <BindingRow label="healthbar" type="Number">
                <strong>{health.toFixed(1)}</strong>
              </BindingRow>

              <BindingRow label="propertyOfhealthBar / numberProperty" type="Number">
                <strong>{health.toFixed(1)}</strong>
              </BindingRow>

              <BindingRow label="colorHealthbar" type="Color">
                <div className="swatches" aria-label="Health bar color">
                  {HEALTH_COLORS.map((color, index) => (
                    <button
                      aria-label={`Set ${color.label} health color`}
                      className={activeColor === index ? "is-selected" : ""}
                      disabled={controlsLocked}
                      key={color.label}
                      onClick={() => {
                        startControlsCooldown();
                        setActiveColor(index);
                      }}
                      style={{ backgroundColor: `rgb(${color.value.join(" ")})` }}
                      title={color.label}
                      type="button"
                    >
                      <Palette size={14} />
                    </button>
                  ))}
                </div>
              </BindingRow>

              {TRIGGERS.map((triggerName) => (
                <BindingRow label={triggerName} type="Trigger" key={triggerName}>
                  <button
                    aria-label={`Trigger ${triggerName}`}
                    className="trigger-button"
                    disabled={controlsLocked}
                    onClick={() => fireAction(triggerActions[triggerName])}
                    type="button"
                  >
                    <Play size={16} />
                  </button>
                </BindingRow>
              ))}
            </div>

            <div className="health-card">
              <label htmlFor="health">
                <Heart size={18} />
                <span>healthbar</span>
              </label>
              <input
                id="health"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={health}
                disabled={controlsLocked}
                onChange={(event) => setHealth(Number(event.target.value))}
                onInput={(event) => setHealth(Number(event.currentTarget.value))}
              />
              <strong>{health.toFixed(1)}</strong>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

type ControlButtonProps = {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

function ControlButton({ active = false, children, disabled = false, label, onClick }: ControlButtonProps) {
  return (
    <button
      aria-label={label}
      className={`control-button${active ? " is-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

type BindingRowProps = {
  children: React.ReactNode;
  label: string;
  type: string;
};

function BindingRow({ children, label, type }: BindingRowProps) {
  return (
    <div className="binding-row">
      <div>
        <strong>{label}</strong>
        <span>{type}</span>
      </div>
      {children}
    </div>
  );
}
