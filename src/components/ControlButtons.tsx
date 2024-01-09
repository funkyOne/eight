interface ControlButtonsProps {
  onStop: () => void;
  onStart: () => void;
  onNext: () => void;
  isPlaying: boolean;
}

export function ControlButtons({ onStop, isPlaying, onStart, onNext }: ControlButtonsProps) {
  return (
    <div className="control-buttons">
      {isPlaying ? (
        <>
          <button onClick={onStop}>STOP</button>
          <button onClick={onNext}>NEXT</button>
        </>
      ) : (
        <button onClick={onStart}>START</button>
      )}
    </div>
  );
}
