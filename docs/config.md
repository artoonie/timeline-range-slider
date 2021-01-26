### Configuration options
Create a slider by calling:
```html
<link rel="stylesheet" href="slider.css">
<script type="text/javascript" src="slider.js"></script>

createSliderAndTimeline(config);
```

The `config` dictionary has the following options:

| key | default | description |
| --- | --- | --- |
| `wrapperDivId`* | _required_ | The div id in which to place the slider |
| `numTicks`* | _required_ | The number of elements in the slider |
| `width` | `600` | The maximum width of the slider. If the page is narrower than this, the slider will responsively scale. |
| `hideTimelineInitially` | `true` | Whether or not the timeline is initially expanded or collapsed |
| `tickText` | `'•'` | The text that marks a tick in the slider |
| `tickLabelPrefix` | `'Round '` | What does each tick represent? Placed in the header row of the timeline. |
| `color` | `'orangered'` | The color of past tick marks. Can be a single string or a list. If it's a list, must be of size numTicks. |
| `sliderValueChanged` | `null` | Callback to be notified when the slider changes. |
| `timelineData` | random data | The timeline data. See below for how to structure this. |

#### Timeline data structure
The `timelineData` contains the events that occurred at each "tick" in the timeline.
It is a list of lists. Each of the `numTicks` elements contains a list of events.
A single event is structured as follows:
```javascript
{
  summaryText: "Short summary",
  className: "custom-class-for-summary-label", /* optional */
  moreInfoText: "Description to show when hovering" /* optional */
}
```

Each "tick" can have multiple events (or zero events).

A complete `timelineData` structure might look like:
```javascript
[
    [
        {summaryText: 'Event 1, tick 1'},
        {summaryText: 'Event 2, tick 1'}
    ],
    [
        {summaryText: 'Event 1, tick 2',
         className: 'some-class'}
    ],
    [ /* No events in tick 3 */
    ],
    [
        {summaryText: 'Event 1, tick 4'},
        {summaryText: 'Event 2, tick 4'},
        {summaryText: 'Event 3, tick 4',
         moreInfoText: 'a long description'}
    ]
]
```