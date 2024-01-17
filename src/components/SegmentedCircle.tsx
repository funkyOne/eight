interface SegmentedCircleProps {
  segments: number;
  lengthA: number; // Length of segment A
  lengthB: number; // Length of segment B
  innerRadius: number; // Radius of the inner circle (hole)
  segmentMargin: number; // Margin between segments
}

const SegmentedCircle = ({ segments, lengthA, lengthB, innerRadius, segmentMargin = 0.01 }: SegmentedCircleProps) => {
  const outerRadius = 100; // Radius of the outer circle
  const viewBoxSize = 220;
  const center = viewBoxSize / 2;

  const drawSegment = (startAngle: number, endAngle: number, color: string) => {
    // Adding margin to the start and end angles
    startAngle += segmentMargin;
    endAngle -= segmentMargin;

    const getCoordinates = (angle: number, radius: number) => ({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });

    const startOuter = getCoordinates(startAngle, outerRadius);
    const endOuter = getCoordinates(endAngle, outerRadius);
    const startInner = getCoordinates(startAngle, innerRadius);
    const endInner = getCoordinates(endAngle, innerRadius);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

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
  for (let i = 0; i < segments; i++) {
    const segmentLength = i % 2 === 0 ? lengthA : lengthB;
    const nextAngle = currentAngle + segmentLength * 2 * Math.PI;
    segmentsArray.push(drawSegment(currentAngle, nextAngle, i % 2 === 0 ? "green" : "blue"));
    currentAngle = nextAngle;
  }

  return (
    <svg width={viewBoxSize} height={viewBoxSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
      {segmentsArray}
    </svg>
  );
};

export default SegmentedCircle;
