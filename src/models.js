// A constant input step can be integrated exactly across each sample interval.
export function simulateNeuron(current, duration = 200) {
  const resting = -65;
  const threshold = -50;
  const timeConstant = 20;
  const resistance = 100; // MΩ, with current in nA and voltage in mV.
  const step = 0.25;
  const samples = [[0, resting]];
  const spikes = [];
  let voltage = resting;
  let refractoryUntil = 0;

  for (let time = 0; time < duration; time += step) {
    const end = time + step;
    if (end <= refractoryUntil) {
      samples.push([end, resting]);
      continue;
    }

    const start = Math.max(time, refractoryUntil);
    const input = time >= 20 && time < 160 ? current : 0;
    const equilibrium = resting + resistance * input;
    const next = equilibrium + (voltage - equilibrium) * Math.exp(-(end - start) / timeConstant);
    if (next >= threshold) {
      const spike = start - timeConstant * Math.log((threshold - equilibrium) / (voltage - equilibrium));
      spikes.push(spike);
      samples.push([spike, threshold], [spike, resting], [end, resting]);
      refractoryUntil = spike + 2;
      voltage = resting;
    } else {
      voltage = next;
      samples.push([end, voltage]);
    }
  }
  return { samples, spikes };
}

export function visibleConnections(edges, threshold, selected = null) {
  return edges.filter(([from, to, weight]) =>
    weight >= threshold && (selected === null || from === selected || to === selected));
}
