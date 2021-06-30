# A lightweight range slider with expandable timeline

See this project at [artoonie.github.io/timeline-range-slider](https://artoonie.github.io/timeline-range-slider)

The project page has dynamic sliders you can interact with.

![Node.js CI](https://github.com/artoonie/timeline-range-slider/workflows/Node.js%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/artoonie/timeline-range-slider/badge.svg?branch=main)](https://coveralls.io/github/artoonie/timeline-range-slider?branch=main)
![npm bundle size](https://img.shields.io/bundlephobia/min/@artoonie/timeline-range-slider)
![npm](https://img.shields.io/npm/dm/@artoonie/timeline-range-slider)


# A lightweight, dependency-free range slider

The default configuration gives you a slider with a collapsible timeline:

[\[interactive demo\]](https://artoonie.github.io/timeline-range-slider)
![ex0](docs/images/ex0.png)

## Features & Benefits
Features:
* A mobile-friendly range slider,
* With a collapsible events timeline to list events which occurred at each index in the slider,
* With tooltips for deeper explanations of the summaries

Benefits:
* Vanilla Javascript & CSS
* No external libraries: no jQuery, bootstrap, Sass, etc
* Simple javascript configuration with sane defaults
* Simple, easy-to-override CSS
* Permissive license

## Examples
### #1: Default

[\[interactive demo\]](https://artoonie.github.io/timeline-range-slider)
![ex1](docs/images/ex0.png)

### #2: Dark theme

[\[interactive demo\]](https://artoonie.github.io/timeline-range-slider)
![ex2](docs/images/ex2.png)

### #3: Small and continuous

[\[interactive demo\]](https://artoonie.github.io/timeline-range-slider)
![ex3](docs/images/ex3.png)

### #4: Variable tick text

[\[interactive demo\]](https://artoonie.github.io/timeline-range-slider)
![ex4](docs/images/ex4.png)

## Usage

### Installation
Pick what works for your setup:
1. `npm i @artoonie/timeline-range-slider`
2. Download assets from [github package](https://github.com/artoonie/timeline-range-slider/packages/592040)
3. Just download the files in the `timeline-range-slider` directory. Go on. I won't judge you.

### Usage
#### API: Vanilla Javascript
If you're not using node.js, functions begin with trs\_ namespace to avoid conflicts:

Include the files in your HTML and create a wrapper div:
```html
<link rel="stylesheet" href="slider.css">
<script type="text/javascript" src="slider.js"></script>
<div id="slide"></div>
```

Create a slider by calling:
```javascript
const config = {wrapperDivId: 'slide', numTicks: 10}
trs_createSliderAndTimeline(config);
```
additional config options are described below.

You can a slider value manually by calling:
```javascript
trs_setSliderValue('slide', 5);
```

You can animate a slider to have it move front-to-back with
```javascript
trs_animate('slide');
```

Hide the timeline with:
```javascript
trs_toggleTimelineVisibility('slide');
```

#### API: Using node.js
HTML:
```html
const slider = require('./timeline-range-slider/slider.js');
require('./timeline-range-slider/slider.css');

<div id="slide"></div>
```

Javascript:
```html
slider.createSliderAndTimeline(config);
slider.setSliderValue('slide', 5);
slider.animate('slide');
slider.toggleTimelineVisibility('slide');
```

### Configuration options
The `config` dictionary has the following options:

| key/default | description |
| --- | --- |
| `wrapperDivId`\* <br/><br/> _required_ | The div id in which to place the slider |
| `numTicks`\* <br/><br/> _required_ | The number of elements in the slider |
| `width` <br/><br/> default: `600` | The maximum width of the slider. If the page is narrower than this, the slider will responsively scale. |
| `hideTimelineInitially` <br/><br/> default: `true` | Whether or not the timeline is initially expanded or collapsed |
| `tickLabelPrefix` <br/><br/> default: `'Round '` | What does each tick represent? Placed in the header row of the timeline. |
| `hideActiveTickText` <br/><br/> default: `false` | Should we hide `tickText` on the active tick? By default, we hide the text and show a slider via CSS. Only change this if you override the CSS for the active tick. |
| `tickText` <br/><br/> default: `'•'` | The text that marks a tick in the slider. Can be a single string or a list. If it's a list, must be the size of numTicks. |
| `color` <br/><br/> default: `'orangered'` | The color of past tick marks. Can be a single string or a list. If it's a list, must be of size numTicks. |
| `sliderValueChanged` <br/><br/> default: `null` | Callback to be notified when the slider changes. |
| `animateOnLoad` <br/><br/> default: `false` | Should the slider animate all steps on load? |
| `timeBetweenStepsMs` <br/><br/> default: `1s/numTicks` | How fast should the animation run? |
| `timelinePeeking` <br/><br/> default: `true` | Should the timeline "peek open" during animation, and close after the animation completes? |
| `timelineData` <br/><br/> default: random data | The timeline data. See below for how to structure this. |
| `leftArrowText` <br/><br/> default: `<` | What text to place in the left arrow button? |
| `rightArrowText` <br/><br/> default: `<` | What text to place in the right arrow button? |

#### Timeline data structure
The `timelineData` contains the events that occurred at each "tick" in the timeline.
It is a list of lists. Each of the `numTicks` elements contains a list of events.
A single event is structured as follows:
```javascript
const oneTimelineItem = {
  summaryText: "Short summary",

  /* optional */
  className: "custom-class-for-summary-label",

  /* optional */
  moreInfoText: "Description to show when hovering" 
}
```

Each "tick" can have multiple events (or zero events).

A complete `timelineData` structure might look like:
```javascript
const timelineData = [
    [
        {summaryText: "Event 1, tick 1"},
        {summaryText: "Event 2, tick 1"}
    ],
    [
        {summaryText: "Event 1, tick 2",
         className: "some-class"}
    ],
    [ /* No events in tick 3 */
    ],
    [
        {summaryText: "Event 1, tick 4"},
        {summaryText: "Event 2, tick 4"},
        {summaryText: "Event 3, tick 4",
         moreInfoText: "a long description"}
    ]
]

```
