export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface PoseFrame {
  timestampMs: number;
  leftHip: Point;
  leftKnee: Point;
  leftAnkle: Point;
  rightHip: Point;
  rightKnee: Point;
  rightAnkle: Point;
}

function angle(a: Point, vertex: Point, c: Point): number {
  const first = { x: a.x - vertex.x, y: a.y - vertex.y };
  const second = { x: c.x - vertex.x, y: c.y - vertex.y };
  const dot = first.x * second.x + first.y * second.y;
  const magnitude =
    Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y);
  if (magnitude === 0) throw new Error("Cannot calculate an angle from overlapping points");
  return (Math.acos(Math.max(-1, Math.min(1, dot / magnitude))) * 180) / Math.PI;
}

export function kneeAngles(frame: PoseFrame) {
  return {
    left: angle(frame.leftHip, frame.leftKnee, frame.leftAnkle),
    right: angle(frame.rightHip, frame.rightKnee, frame.rightAnkle),
  };
}

export function rangeOfMotion(values: number[]): number {
  if (values.length < 2) throw new Error("At least two samples are required");
  return Math.max(...values) - Math.min(...values);
}

export function asymmetryPercent(left: number, right: number): number {
  const mean = (Math.abs(left) + Math.abs(right)) / 2;
  if (mean === 0) return 0;
  return (Math.abs(left - right) / mean) * 100;
}

export interface PoseLandmarkProvider {
  initialize(): Promise<void>;
  detect(video: HTMLVideoElement, timestampMs: number): Promise<PoseFrame | null>;
  close(): Promise<void>;
}
