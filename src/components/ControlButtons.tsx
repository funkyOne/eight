interface ControlButtonsProps {
  onStop: () => void;
  onNext: () => void;
}

export function ControlButtons({ onStop, onNext }: ControlButtonsProps) {
  return (
    <div className="control-buttons">
      <button className="stop-button" onClick={onStop}>
        STOP
      </button>
      <button className="next-button" onClick={onNext}>
        NEXT
      </button>
    </div>
  );
}
