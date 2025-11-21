interface ControlButtonsProps {
  onStop: () => void;
  onNext: () => void;
}

export function ControlButtons({ onStop, onNext }: ControlButtonsProps) {
  const handleStop = (e: MouseEvent) => {
    e.stopPropagation();
    onStop();
  };

  const handleNext = (e: MouseEvent) => {
    e.stopPropagation();
    onNext();
  };

  return (
    <div className="control-buttons" onClick={(e) => e.stopPropagation()}>
      <button className="stop-button" onClick={handleStop}>
        Stop
      </button>
      <button className="next-button" onClick={handleNext}>
        Next
      </button>
    </div>
  );
}
