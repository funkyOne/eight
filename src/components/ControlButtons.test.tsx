import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { ControlButtons } from "./ControlButtons";

describe("ControlButtons", () => {
  it("renders stop and next buttons", () => {
    const onStop = vi.fn();
    const onNext = vi.fn();

    render(<ControlButtons onStop={onStop} onNext={onNext} />);

    expect(screen.getByText("Stop")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("calls onStop when stop button is clicked", () => {
    const onStop = vi.fn();
    const onNext = vi.fn();

    render(<ControlButtons onStop={onStop} onNext={onNext} />);

    fireEvent.click(screen.getByText("Stop"));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("calls onNext when next button is clicked", () => {
    const onStop = vi.fn();
    const onNext = vi.fn();

    render(<ControlButtons onStop={onStop} onNext={onNext} />);

    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
