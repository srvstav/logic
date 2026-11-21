import { graphFigure, neuronFigure } from './figures.js';
import { readout, setText, slider } from './ui.js';

export function mountGraph({ data, mountFigure, tools, notes, view, stopTour }) {
  const state = readout();
  let threshold = 32;
  let selected = null;
  const graph = graphFigure(data, index => {
    nodes.value = selected === index ? '' : String(index);
    focusNode();
  });
  const nodes = document.createElement('select');
  nodes.setAttribute('aria-label', 'Focus neuron');
  nodes.add(new Option('All neurons', ''));
  data.nodes.forEach((node, index) => nodes.add(new Option(node.label, String(index))));
  function focusNode() {
    stopTour();
    view.dataset.inspecting = '';
    selected = nodes.value === '' ? null : Number(nodes.value);
    update();
  }
  nodes.addEventListener('change', focusNode);
  const details = document.createElement('details');
  const summary = setText(details, 'summary', 'Connection data');
  const table = document.createElement('table');
  const headings = table.createTHead().insertRow();
  for (const column of ['From', 'To', 'Synapses']) {
    const heading = setText(headings, 'th', column);
    heading.scope = 'col';
  }
  const body = table.createTBody();
  details.append(table);
  notes.append(details);
  function update() {
    const { count, visible } = graph.update(threshold, selected);
    state.textContent = count;
    summary.textContent = 'Connection data · ' + count;
    body.replaceChildren();
    for (const [from, to, weight] of visible) {
      const row = body.insertRow();
      row.insertCell().textContent = data.nodes[from].label;
      row.insertCell().textContent = data.nodes[to].label;
      row.insertCell().textContent = weight;
    }
  }
  mountFigure(graph.element);
  const control = slider('Minimum synapses', { min: 5, max: data.maximum + 1, value: threshold }, value => {
    stopTour();
    threshold = value;
    update();
  }, value => `${value} synapses`);
  tools.append(control, nodes, state);
  update();
}

export function mountNeuron({ signal, mountFigure, tools, view, stopTour }) {
  const start = 0.24;
  const neuron = neuronFigure(start);
  const state = readout();
  let last = -1;
  const control = slider('Input current', { min: 0, max: 0.5, step: 0.01, value: start },
    current => { stopTour(); change(current); }, current => current.toFixed(2) + ' nanoamperes');
  const input = control.querySelector('input');
  function change(current) {
    if (current === last) return;
    last = current;
    state.textContent = current.toFixed(2) + ' nA · ' + neuron.update(current);
    input.value = current;
    input.setAttribute('aria-valuetext', current.toFixed(2) + ' nanoamperes');
  }
  mountFigure(neuron.element);
  tools.append(control, state);
  change(start);
  let scrubbing;
  function scrub(event) {
    const bounds = view.getBoundingClientRect();
    const fraction = (event.clientX - bounds.left) / bounds.width;
    change(Math.max(0, Math.min(50, Math.round(fraction * 50))) / 100);
  }
  view.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    stopTour();
    view.dataset.inspecting = '';
    scrubbing = event.pointerId;
    view.setPointerCapture(scrubbing);
    scrub(event);
  }, { signal });
  view.addEventListener('pointermove', event => {
    if (event.pointerId === scrubbing) scrub(event);
  }, { signal });
  for (const type of ['pointerup', 'pointercancel']) {
    view.addEventListener(type, () => { scrubbing = undefined; }, { signal });
  }
}
