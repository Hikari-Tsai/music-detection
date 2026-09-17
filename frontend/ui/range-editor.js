import { setText } from './i18n.js';
const $ = (id) => document.getElementById(id);

export function createRangeEditor(onChange) {
  let duration = 0;
  let start = 0;
  let end = 0;
  let busy = false;
  const valid = () =>
    duration > 0 &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start >= 0 &&
    end <= duration &&
    end - start >= 1 - 1e-8;
  const full = () => start === 0 && end === duration;
  function render() {
    for (const edge of ['start', 'end']) {
      const value = edge === 'start' ? start : end;
      $(`clip-${edge}-slider`).max = duration;
      $(`clip-${edge}`).max = duration;
      $(`clip-${edge}-slider`).value = Number.isFinite(value) ? value : 0;
    }
    $('range-fields').disabled = busy || !duration;
    $('reset-range').disabled = busy || !duration || full();
    setText(
      'range-help',
      !duration
        ? { key: 'rangeUnavailable' }
        : !valid()
          ? { key: 'rangeInvalid' }
          : { key: 'rangeHelp' }
    );
    $('range-help').classList.toggle('invalid-range', !!duration && !valid());
    setText(
      'range-summary',
      valid()
        ? {
            key: 'rangeSummary',
            args: {
              start: start.toFixed(3),
              end: end.toFixed(3),
              duration: (end - start).toFixed(3)
            }
          }
        : { key: 'rangeWhole' }
    );
  }
  function change() {
    render();
    onChange();
  }
  for (const edge of ['start', 'end']) {
    for (const suffix of ['', '-slider']) {
      $(`clip-${edge}${suffix}`).addEventListener('input', (event) => {
        const value = event.target.value === '' ? NaN : Number(event.target.value);
        if (edge === 'start') start = value;
        else end = value;
        if (suffix) $(`clip-${edge}`).value = value;
        change();
      });
    }
  }
  function reset() {
    start = 0;
    end = duration;
    $('clip-start').value = start;
    $('clip-end').value = end;
    render();
  }
  $('reset-range').addEventListener('click', () => {
    reset();
    onChange();
  });
  return {
    setDuration(value) {
      duration = Number.isFinite(value) ? Math.floor(value * 1000) / 1000 : 0;
      reset();
    },
    setBusy(value) {
      busy = value;
      render();
    },
    get valid() {
      return valid();
    },
    get available() {
      return duration > 0;
    },
    get full() {
      return full();
    },
    get range() {
      return valid() && !full() ? { start, end } : null;
    },
    get bounds() {
      return valid() ? { start, end } : null;
    }
  };
}
