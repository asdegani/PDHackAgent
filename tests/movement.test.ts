import assert from "node:assert/strict";
import test from "node:test";
import { asymmetryPercent, kneeAngles, rangeOfMotion } from "../lib/analysis/movement";

test("calculates knee angles from a pose frame", () => {
  const angles = kneeAngles({
    timestampMs: 0,
    leftHip: { x: 0, y: 0 },
    leftKnee: { x: 0, y: 1 },
    leftAnkle: { x: 1, y: 1 },
    rightHip: { x: 2, y: 0 },
    rightKnee: { x: 2, y: 1 },
    rightAnkle: { x: 3, y: 1 },
  });

  assert.equal(angles.left, 90);
  assert.equal(angles.right, 90);
});

test("calculates range and asymmetry", () => {
  assert.equal(rangeOfMotion([165, 120, 150]), 45);
  assert.equal(asymmetryPercent(40, 44), 100 * (4 / 42));
});
