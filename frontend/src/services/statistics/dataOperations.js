let mathJs = require("mathjs");

// ======== Par. coord. ========

const MAX_STRING_DISPLAYED = 28;
const MAX_STRING_LENGTH = 30;

// create data for the plotly par. coord.
const columnsCreation = function (columns, selectedSamplesIds) {
  const plotlyColumns = columns.map((col) => {
    if (col.type == String) {
      const tickvals = [...Array(col.nbOccurrence).keys()];
      let ticktext = [];

      if (col.nbOccurrence > MAX_STRING_DISPLAYED)
        // No text on the axis
        ticktext = tickvals.map(() => "");
      else
        ticktext = col.uniques.map((v) => {
          if (v === null) return "null";
          return v.length > MAX_STRING_LENGTH ? v.substring(0, MAX_STRING_LENGTH) + "..." : v;
        });

      return {
        label: col.label,
        values: selectedSamplesIds.map((sId) => col.valuesIndex[sId]),
        tickvals: tickvals,
        ticktext: ticktext,
      };
    } else {
      const values = selectedSamplesIds.map((sId) => {
        const v = col.values[sId];
        if (v === null) return undefined;
        return v;
      });
      return {
        type: "int",
        label: col.label,
        values: values,
      };
    }
  });
  return plotlyColumns;
};

// ======== Data point plot ========

const asc = (arr) => arr.sort((a, b) => a - b);

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const mean = (arr) => (arr.length ? sum(arr) / arr.length : null);

const getMin = (arr) => {
  let min = Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] !== null && arr[i] < min) min = arr[i];
  return min;
};
const getMax = (arr) => {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] !== null && arr[i] > max) max = arr[i];
  return max;
};
const mode = (arr) => {
  let numMapping = {};
  let greatestFreq = 0;
  let mode;
  arr.forEach((number) => {
    numMapping[number] = (numMapping[number] || 0) + 1;

    if (greatestFreq < numMapping[number]) {
      greatestFreq = numMapping[number];
      mode = number;
    }
  });
  return { top: +mode, frequency: greatestFreq };
};

const quartile = (sorted, q) => {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined)
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
};

// Average, min, max, q1, q2 and standard deviation calculation
const getStats = function (
  x,
  y,
  interval,
  { fromIn = null, toIn = null, detailed = true, displayNull = true }
) {
  const xSections = [];
  const average = [];
  const min = [];
  const max = [];
  const q1 = [];
  const q3 = [];
  const std = [];

  const from = fromIn !== null ? fromIn : getMin(x);
  const to = toIn !== null ? toIn : getMax(x);
  const sectionLength = (to - from) / interval;

  for (let i = 0; i < interval + 1; i++) {
    const ySection = [];
    x.forEach((v, vId) => {
      if (v >= sectionLength * i + from && v < sectionLength * (i + 1) + from && y[vId] !== null)
        ySection.push(y[vId]);
    });

    // xSections.push(((sectionLength * i) + 2 * from + (sectionLength * (i + 1))) / 2)
    xSections.push(sectionLength * i + from);

    if (ySection.length > 0) {
      const sorted = asc(ySection);

      average.push(mean(ySection));
      if (detailed) min.push(sorted[0]);
      if (detailed) max.push(sorted[sorted.length - 1]);
      if (detailed) q1.push(quartile(sorted, 0.25));
      if (detailed) q3.push(quartile(sorted, 0.75));
      if (detailed) std.push(mathJs.std(ySection));
    } else {
      average.push(displayNull ? 0 : null);
      if (detailed) min.push(displayNull ? 0 : null);
      if (detailed) max.push(displayNull ? 0 : null);
      if (detailed) q1.push(displayNull ? 0 : null);
      if (detailed) q3.push(displayNull ? 0 : null);
      if (detailed) std.push(displayNull ? 0 : null);
    }
  }

  return {
    xSections,
    average,
    min,
    max,
    q1,
    q3,
    std,
  };
};

// ======== Data repartition ========
// get data distribution from data array and an interval
const getRepartition = function (x, interval, min, max) {
  let xSections = [];
  let repartition = [];

  let sectionLength = (max - min) / interval;

  for (let i = 0; i < interval + 1; i++) {
    xSections.push(sectionLength * i + min);
    repartition.push(
      x.filter(
        (v) => v >= sectionLength * i + min && v < sectionLength * (i + 1) + min && v !== null
      ).length
    );
  }

  return { xSections, repartition };
};

// ======== Common =======

// return id list list from selector array
const groupBy = function (selector, selectorUniques) {
  let groups = [];
  let idsList = [...Array(selector.length).keys()];
  selectorUniques.forEach((val) => {
    groups.push(idsList.filter((i) => selector[i] == val));
  });
  return groups;
};

// to display a float more nicely
const humanize = function (x) {
  return x.toFixed(4).replace(/\.?0*$/, "");
};

export default {
  columnsCreation,
  getStats,
  getRepartition,
  groupBy,
  mean,
  getMin,
  getMax,
  mode,
  humanize,
};
