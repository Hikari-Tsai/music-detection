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
    const percent = (value) =>
      duration && Number.isFinite(value) ? Math.min(100, Math.max(0, (value / duration) * 100)) : 0;
    $('range-bar').style.setProperty('--range-start', `${percent(start)}%`);
    $('range-bar').style.setProperty('--range-end', `${percent(end)}%`);
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
        let value = event.target.value === '' ? NaN : Number(event.target.value);
        // Keep a one-second minimum while dragging; numeric inputs still allow
        // intermediate invalid values so either endpoint can be edited freely.
        if (suffix) {
          const limit =
            edge === 'start'
              ? Math.max(0, (Number.isFinite(end) ? end : duration) - 1)
              : Math.min(duration, (Number.isFinite(start) ? start : 0) + 1);
          value = edge === 'start' ? Math.min(value, limit) : Math.max(value, limit);
          value = Math.min(duration, Math.max(0, Math.round(value * 1000) / 1000));
        }
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
