import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateNeuron, visibleConnections } from '../src/models.js';
import { newtonBasin, renderRows, roots } from '../src/newton.js';

test('Newton iteration identifies all three roots and leaves zero unclassified', () => {
  roots.forEach(([x, y], index) => {
    assert.equal(newtonBasin(x, y), index * 64);
    assert.equal(newtonBasin(x + 0.11, y + 0.06) >> 6, index);
  });
  assert.equal(newtonBasin(0, 0), -1);
  assert.equal(newtonBasin(2, 0, 0), -1);
});

test('Newton preserves conjugate symmetry and draws the same frame in row chunks', () => {
  const upper = newtonBasin(-0.7, 1.1);
  const lower = newtonBasin(-0.7, -1.1);
  assert.equal(upper >> 6, 1);
  assert.equal(lower >> 6, 2);
  assert.equal(upper & 63, lower & 63);
  const frame = { width: 7, height: 5, x: 0, y: 0, span: 3 };
  const pixels = new Uint8ClampedArray(frame.width * frame.height * 4);
  const chunked = pixels.slice();
  renderRows(pixels, frame, 0, 5);
  renderRows(chunked, frame, 0, 2);
  renderRows(chunked, frame, 2, 5);
  assert.deepEqual(pixels, chunked);
  assert.equal(pixels[71], 255);
});

test('leaky neuron stays at rest with no input and below threshold with a weak input', () => {
  const rest = simulateNeuron(0);
  assert.ok(rest.samples.every(([, voltage]) => voltage === -65));
  assert.deepEqual(simulateNeuron(0.12).spikes, []);
});

test('first spike matches the closed form and the cell resets for the refractory period', () => {
  const model = simulateNeuron(0.24);
  const first = 20 - 20 * Math.log(1 - 15 / 24);
  assert.ok(Math.abs(model.spikes[0] - first) < 1e-9);
  assert.ok(model.spikes.every(time => time >= 20 && time <= 160));
  assert.ok(model.spikes.slice(1).every((time, index) => time - model.spikes[index] > 2));
  assert.ok(model.samples.filter(([time]) => time > model.spikes[0] && time <= model.spikes[0] + 2).every(([, voltage]) => voltage === -65));
});

const data = JSON.parse(await readFile(new URL('../assets/flywire.json', import.meta.url), 'utf8'));
test('FlyWire v783 extract has valid IDs, unique directed edges and a usable threshold range', () => {
  assert.equal(data.nodes.length, 13);
  assert.equal(data.nodes[data.center].id, '720575940610901930');
  assert.equal(new Set(data.nodes.map(node => node.id)).size, data.nodes.length);
  const pairs = new Set();
  for (const [from, to, weight] of data.edges) {
    assert.ok(data.nodes[from] && data.nodes[to]);
    assert.notEqual(from, to);
    assert.ok(Number.isInteger(weight) && weight >= 5 && weight <= data.maximum);
    assert.ok(!pairs.has(from + ',' + to));
    pairs.add(from + ',' + to);
  }
  assert.ok(visibleConnections(data.edges, 32).length < data.edges.length);
  assert.ok(visibleConnections(data.edges, 32, data.center).every(([from, to]) => from === data.center || to === data.center));
  assert.deepEqual(visibleConnections(data.edges, data.maximum + 1), []);
});
