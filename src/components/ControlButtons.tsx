interface ControlButtonsProps {
  onStop: () => void;
  onNext: () => void;
}

export function ControlButtons({ onStop, onNext }: ControlButtonsProps) {
  return (
    <div className="control-buttons">
      <button className="stop-button" onClick={onStop}>
        Stop
      </button>
      <button className="next-button" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
