import { FunctionComponent } from "preact";

interface Segment {
  color: string;
  length: number;
}

interface SegmentedCircleProps {
  segments: Segment[];
  innerRadius: number; // Radius of the inner circle (hole)
  segmentMargin: number; // Margin between segments in radians
}

const SegmentedCircle: FunctionComponent<SegmentedCircleProps> = ({ segments, innerRadius, segmentMargin }) => {
  const outerRadius = 100; // Radius of the outer circle
  const viewBoxSize = 220;
  const center = viewBoxSize / 2;

  // Calculate the total relative length
  const totalLength = segments.reduce((acc, segment) => acc + segment.length, 0);

  const drawSegment = (startAngle: number, endAngle: number, color: string) => {
    // Adjusting the start and end angles for segment margin
    const adjustedStartAngle = startAngle + segmentMargin;
    const adjustedEndAngle = endAngle - segmentMargin;

    const getCoordinates = (angle: number, radius: number) => ({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });

    const startOuter = getCoordinates(adjustedStartAngle, outerRadius);
    const endOuter = getCoordinates(adjustedEndAngle, outerRadius);
    const startInner = getCoordinates(adjustedStartAngle, innerRadius);
    const endInner = getCoordinates(adjustedEndAngle, innerRadius);
    const largeArcFlag = adjustedEndAngle - adjustedStartAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      "Z",
    ].join(" ");

    return <path d={pathData} fill={color} key={`${startAngle}-${endAngle}`} />;
  };

  const segmentsArray = [];
  let currentAngle = 0;
  for (let segment of segments) {
    const segmentAngle = (segment.length / totalLength) * 2 * Math.PI;
    const nextAngle = currentAngle + segmentAngle;
    segmentsArray.push(drawSegment(currentAngle, nextAngle, segment.color));
    currentAngle = nextAngle;
  }

  return (
    <svg width={viewBoxSize} height={viewBoxSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
      {segmentsArray}
    </svg>
  );
};

export default SegmentedCircle;
