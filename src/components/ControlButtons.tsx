// src/components/ControlButtons.tsx

import { FunctionComponent } from 'preact';

interface ControlButtonsProps {
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onStart: () => void;
  onNext: () => void;
}

const ControlButtons: FunctionComponent<ControlButtonsProps> = ({
  onStop,
  onPause,
  onResume,
  onStart,
  onNext,
}) => {
  return (
    <div className="control-buttons">
      <button onClick={onStop}>STOP</button>
      <button onClick={onPause}>PAUSE</button>
      <button onClick={onResume}>RESUME</button>
      <button onClick={onStart}>START</button>
      <button onClick={onNext}>&gt;&gt;</button>
    </div>
  );
};

export default ControlButtons;
