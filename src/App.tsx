import { useEffect, useMemo, useState } from 'react'
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceBoolean,
  useViewModelInstanceNumber,
} from '@rive-app/react-webgl2'
import './App.css'

const HEALTHBAR_RIVE_SRC = `${import.meta.env.BASE_URL}healthbar.riv`
const BLOCK_BUTTON_RIVE_SRC = `${import.meta.env.BASE_URL}block_button.riv`
const VALUE_STEPS = Array.from({ length: 11 }, (_, index) => index / 10)
const BLOCK_COLOR_VALUES = [1, 2, 3, 4]
const LOW_HEALTH_THRESHOLD = 0.1

function App() {
  const [healthValue, setHealthValue] = useState(1)
  const [blockColorValue, setBlockColorValue] = useState(2)
  const [blockClicking, setBlockClicking] = useState(false)
  const isLowHealth = healthValue <= LOW_HEALTH_THRESHOLD
  const layout = useMemo(
    () => new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    [],
  )

  const { rive: blockRive, RiveComponent: BlockButtonRive } = useRive(
    {
      src: BLOCK_BUTTON_RIVE_SRC,
      artboard: 'Button',
      stateMachines: 'Interaction',
      autoplay: true,
      autoBind: true,
      dispatchPointerExit: true,
      layout,
    },
    {
      shouldResizeCanvasToContainer: true,
      useOffscreenRenderer: true,
    },
  )

  const blockViewModel = useViewModel(blockRive, { name: 'ViewModel1' })
  const blockViewModelInstance = useViewModelInstance(blockViewModel, {
    rive: blockRive,
    useDefault: true,
  })
  const blockNumberColor = useViewModelInstanceNumber(
    'numberColor',
    blockViewModelInstance,
  )
  const blockClickingBoolean = useViewModelInstanceBoolean(
    'clickingBoolean',
    blockViewModelInstance,
  )

  const { rive: healthRive, RiveComponent: HealthbarRive } = useRive(
    {
      src: HEALTHBAR_RIVE_SRC,
      artboard: 'Health Bar',
      stateMachines: 'Healthbar',
      autoplay: true,
      autoBind: true,
      layout,
    },
    {
      shouldResizeCanvasToContainer: true,
      useOffscreenRenderer: true,
    },
  )

  const viewModel = useViewModel(healthRive, { name: 'MainVM' })
  const viewModelInstance = useViewModelInstance(viewModel, {
    rive: healthRive,
    useDefault: true,
  })
  const numberProperty = useViewModelInstanceNumber(
    'healthbar',
    viewModelInstance,
  )
  const booleanProperty = useViewModelInstanceBoolean(
    'booleanProperty',
    viewModelInstance,
  )

  useEffect(() => {
    numberProperty.setValue(healthValue)
  }, [healthValue, numberProperty])

  useEffect(() => {
    booleanProperty.setValue(isLowHealth)
  }, [booleanProperty, isLowHealth])

  useEffect(() => {
    blockNumberColor.setValue(blockColorValue)
  }, [blockColorValue, blockNumberColor])

  useEffect(() => {
    blockClickingBoolean.setValue(blockClicking)
  }, [blockClicking, blockClickingBoolean])

  useEffect(() => {
    if (!blockClicking) {
      return
    }

    const stopClicking = () => setBlockClicking(false)

    window.addEventListener('pointerup', stopClicking)
    window.addEventListener('pointercancel', stopClicking)
    window.addEventListener('blur', stopClicking)

    return () => {
      window.removeEventListener('pointerup', stopClicking)
      window.removeEventListener('pointercancel', stopClicking)
      window.removeEventListener('blur', stopClicking)
    }
  }, [blockClicking])

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Math.round(Number(event.target.value) * 10) / 10
    setHealthValue(Math.max(0, Math.min(1, nextValue)))
  }

  const handleBlockNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = Math.round(Number(event.target.value))
    setBlockColorValue(Math.max(1, Math.min(4, nextValue)))
  }

  const startBlockPress = () => {
    setBlockClicking(true)
  }

  const stopBlockPress = () => {
    setBlockClicking(false)
  }

  return (
    <main className="app-shell">
      <section className="rive-stage" aria-label="Rive previews">
        <div className="block-button-hitarea">
          <BlockButtonRive className="block-button-canvas" />
          <div
            className="block-button-target"
            role="button"
            tabIndex={0}
            aria-label="Press block button"
            aria-pressed={blockClicking}
            onPointerDown={startBlockPress}
            onPointerUp={stopBlockPress}
            onPointerCancel={stopBlockPress}
            onPointerLeave={(event) => {
              if (event.buttons === 1) {
                stopBlockPress()
              }
            }}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault()
                startBlockPress()
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault()
                stopBlockPress()
              }
            }}
          />
        </div>
        <HealthbarRive className="healthbar-canvas" />
      </section>

      <section className="control-panel" aria-label="Health controls">
        <div className="control-group">
          <div className="control-header">
            <div>
              <h1>Block button</h1>
              <p>ViewModel: ViewModel1</p>
            </div>
            <output className="value-readout" htmlFor="block-color-range">
              {blockColorValue}
            </output>
          </div>

          <div className="slider-row">
            <input
              id="block-color-range"
              type="range"
              min="1"
              max="4"
              step="1"
              value={blockColorValue}
              onChange={handleBlockNumberChange}
              aria-label="Block button number color"
            />
            <div className="tick-row tick-row-four" aria-hidden="true">
              {BLOCK_COLOR_VALUES.map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </div>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={blockClicking}
              onChange={(event) => setBlockClicking(event.target.checked)}
            />
            <span>clickingBoolean</span>
          </label>

          <div className="binding-grid">
            <div>
              <span>numberColor</span>
              <strong>{blockColorValue}</strong>
            </div>
            <div>
              <span>clickingBoolean</span>
              <strong>{blockClicking ? 'true' : 'false'}</strong>
            </div>
          </div>
        </div>

        <div className="control-group">
        <div className="control-header">
          <div>
            <h1>Healthbar</h1>
            <p>ViewModel: MainVM</p>
          </div>
          <output className="value-readout" htmlFor="health-range">
            {healthValue.toFixed(1)}
          </output>
        </div>

        <div className="slider-row">
          <input
            id="health-range"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={healthValue}
            onChange={handleSliderChange}
            aria-label="Health value"
          />
          <div className="tick-row" aria-hidden="true">
            {VALUE_STEPS.map((step) => (
              <span key={step}>{step.toFixed(1)}</span>
            ))}
          </div>
        </div>

        <div className="binding-grid">
          <div>
            <span>healthbar</span>
            <strong>{healthValue.toFixed(1)}</strong>
          </div>
          <div>
            <span>booleanProperty</span>
            <strong>{isLowHealth ? 'true' : 'false'}</strong>
          </div>
        </div>
        </div>
      </section>
    </main>
  )
}

export default App
