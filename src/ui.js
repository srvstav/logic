export function button(text, label, action) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = text;
  if (label) {
    element.setAttribute('aria-label', label);
    element.title = label;
  }
  element.addEventListener('click', action);
  return element;
}

export function slider(label, { min, max, step = 1, value }, action, display = String) {
  const wrapper = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'range';
  Object.assign(input, { min, max, step, value });
  input.setAttribute('aria-valuetext', display(value));
  input.addEventListener('input', () => {
    const nextValue = Number(input.value);
    input.setAttribute('aria-valuetext', display(nextValue));
    action(nextValue);
  });
  wrapper.append(label, input);
  return wrapper;
}

export function readout() {
  const element = document.createElement('span');
  element.className = 'readout';
  return element;
}

export function message(view, text, waiting = false) {
  const element = document.createElement('div');
  element.className = 'view-message';
  element.setAttribute('role', 'status');
  const copy = setText(element, 'span', text);
  if (waiting) {
    copy.className = 'sr-only';
    const mark = document.createElement('span');
    mark.className = 'waiting-mark';
    mark.setAttribute('aria-hidden', 'true');
    element.append(mark);
  }
  view.append(element);
  return element;
}

export function setText(parent, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}
