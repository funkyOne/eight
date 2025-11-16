import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders with correct width based on progress", () => {
    render(<ProgressBar progress={0.5} />);
    const progressBar = screen.getByRole("progressbar");
    const progressBarInner = progressBar.firstElementChild;
    expect(progressBarInner).toHaveStyle({ width: "50%" });
  });

  it("renders with 0% width when progress is 0", () => {
    render(<ProgressBar progress={0} />);
    const progressBar = screen.getByRole("progressbar");
    const progressBarInner = progressBar.firstElementChild;
    expect(progressBarInner).toHaveStyle({ width: "0%" });
  });

  it("renders with 100% width when progress is 1", () => {
    render(<ProgressBar progress={1} />);
    const progressBar = screen.getByRole("progressbar");
    const progressBarInner = progressBar.firstElementChild;
    expect(progressBarInner).toHaveStyle({ width: "100%" });
  });

  it("sets correct ARIA attributes", () => {
    render(<ProgressBar progress={0.75} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });
});
