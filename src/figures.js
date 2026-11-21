import { simulateNeuron, visibleConnections } from './models.js';

const svgNS = 'http://www.w3.org/2000/svg';
const width = 760;
const height = 439;

function svg(name, attributes, text) {
  const element = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text) element.textContent = text;
  return element;
}

function figure(label) {
  return svg('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label });
}

function label(x, y, text, options = {}) {
  return svg('text', { x, y, class: 'scientific-label', fill: '#c3cfbf', 'font-size': 14, 'font-family': 'Helvetica, sans-serif', ...options }, text);
}

export function neuronFigure(initialCurrent) {
  const chart = figure('');
  const x = time => 82 + time * 3.11;
  const y = voltage => 74 + (-44 - voltage) * 10.4;
  const last = x(200);

  chart.append(svg('rect', { x: x(20), y: 70, width: x(160) - x(20), height: 286, fill: '#283731' }));
  chart.append(label(x(20) + 8, 92, 'Input on', { fill: '#d2dfcc' }));
  for (const voltage of [-70, -65, -60, -55, -50, -45]) {
    const line = { x1: x(0), x2: last, y1: y(voltage), y2: y(voltage), stroke: '#43524b' };
    if (voltage === -50) Object.assign(line, { stroke: '#f3a68e', 'stroke-dasharray': '6 5' });
    chart.append(svg('line', line), label(68, y(voltage) + 4, String(voltage).replace('-', '−'), { 'text-anchor': 'end' }));
  }
  chart.append(label(last - 5, y(-50) - 8, 'Threshold', { 'text-anchor': 'end', fill: '#ffd4c2' }));
  for (const time of [0, 40, 80, 120, 160, 200]) {
    chart.append(svg('line', { x1: x(time), x2: x(time), y1: 70, y2: 366, stroke: '#43524b' }));
    chart.append(label(x(time), 388, String(time), { 'text-anchor': 'middle' }));
  }
  chart.append(label(40, 58, 'mV'), label(last, 415, 'Time (ms)', { 'text-anchor': 'end' }));
  const trace = svg('path', { fill: 'none', stroke: '#f0e3a5', 'stroke-width': 2.8, 'stroke-linejoin': 'round' });
  const ticks = svg('path', { fill: 'none', stroke: '#ffad92', 'stroke-width': 2 });
  chart.append(trace, ticks);

  function update(current) {
    const { samples, spikes } = simulateNeuron(current);
    trace.setAttribute('d', 'M' + samples.map(([time, voltage]) => `${x(time).toFixed(2)},${y(voltage).toFixed(2)}`).join('L'));
    ticks.setAttribute('d', spikes.map(time => `M${x(time).toFixed(2)},${y(-50) - 4}v-24`).join(''));
    const count = `${spikes.length} ${spikes.length === 1 ? 'spike' : 'spikes'}`;
    chart.setAttribute('aria-label', `Membrane voltage over 200 milliseconds. A ${current.toFixed(2)} nanoampere current step produces ${count}.`);
    return count;
  }

  update(initialCurrent);
  return { element: chart, update };
}

export function graphFigure(data, onSelect) {
  const chart = figure('');
  const arrows = svg('defs', {});
  for (const [id, fill] of [['arrow', '#db9f7b'], ['arrow-dim', '#a7b8ad']]) {
    const marker = svg('marker', { id, viewBox: '0 0 9 8', refX: 8, refY: 4, markerWidth: 7, markerHeight: 6, markerUnits: 'userSpaceOnUse', orient: 'auto' });
    marker.append(svg('path', { d: 'M0 0 9 4 0 8Z', fill }));
    arrows.append(marker);
  }
  chart.append(arrows);
  for (const x of [155, 380, 605]) {
    chart.append(svg('line', { x1: x, x2: x, y1: 63, y2: 396, stroke: '#33443b', 'stroke-dasharray': '2 6' }));
  }
  const edgeLayer = svg('g', {});
  chart.append(edgeLayer);
  const nodeLayer = svg('g', {});
  chart.append(nodeLayer);
  const edges = data.edges.map(([from, to, count]) => {
    const left = data.nodes[from];
    const right = data.nodes[to];
    const dx = right.x - left.x;
    const dy = right.y - left.y;
    const length = Math.hypot(dx, dy);
    const nx = dx / length;
    const ny = dy / length;
    const bend = Math.abs(dx) < 10 ? 37 : 15;
    const active = from === data.center || to === data.center;
    const path = svg('path', {
      d: `M ${left.x + 13 * nx} ${left.y + 13 * ny} Q ${(left.x + right.x) / 2 - bend * ny} ${(left.y + right.y) / 2 + bend * nx} ${right.x - 15 * nx} ${right.y - 15 * ny}`,
      fill: 'none', stroke: active ? '#db9f7b' : '#a7b8ad', opacity: active ? '.9' : '.55',
      'stroke-width': 0.9 + 4 * Math.sqrt(count / data.maximum),
      'marker-end': active ? 'url(#arrow)' : 'url(#arrow-dim)',
    });
    path.append(svg('title', {}, `${left.label} → ${right.label}: ${count} synapses`));
    edgeLayer.append(path);
    return path;
  });
  const nodes = data.nodes.map(({ x, y, id, label: name }, index) => {
    const group = svg('g', { class: 'graph-node' });
    group.addEventListener('click', () => onSelect(index));
    group.append(svg('circle', { cx: x, cy: y, r: 18, fill: 'transparent' }));
    group.append(svg('title', {}, `${name} · FlyWire root ${id}`));
    group.append(svg('circle', { cx: x, cy: y, r: index === data.center ? 12 : 8, fill: index === data.center ? '#ffd4a9' : '#162521', stroke: '#e8c0a0', 'stroke-width': 2 }));
    const align = x > 400 ? 'start' : x < 360 ? 'end' : 'middle';
    group.append(label(x + (align === 'start' ? 16 : align === 'end' ? -16 : 0), y + (align === 'middle' ? -23 : 5), name, { 'text-anchor': align, fill: '#f6e7d0', 'font-size': 15 }));
    nodeLayer.append(group);
    return group;
  });

  function update(threshold, selected = null) {
    const visible = new Set(visibleConnections(data.edges, threshold, selected));
    const connected = new Set(visible.size ? [...visible].flatMap(([from, to]) => [from, to]) : []);
    edges.forEach((path, index) => { path.style.display = visible.has(data.edges[index]) ? '' : 'none'; });
    nodes.forEach((group, index) => {
      group.setAttribute('opacity', connected.has(index) || index === selected ? '1' : '.45');
      group.lastElementChild.setAttribute('font-weight', index === selected ? 'bold' : 'normal');
    });
    const count = `${visible.size} ${visible.size === 1 ? 'connection' : 'connections'}`;
    chart.setAttribute('aria-label', `Directed FlyWire graph with ${count} at the minimum of ${threshold} synapses.`);
    return { count, visible };
  }
  return { element: chart, update };
}
