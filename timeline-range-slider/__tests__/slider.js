const slider = require('../slider.js');

beforeEach(() => {
  document.body.innerHTML = '<div id="div-id"></div>'

  // See: https://github.com/jsdom/jsdom/issues/1695
  Element.prototype.scrollIntoView = jest.fn();

  window.requestAnimationFrame = (fn) => { fn(); }
});

function div() {
  return document.getElementById('div-id');
}
function ticks() {
  return document.getElementsByClassName('slider-item');
}
function timelines() {
  return document.getElementsByClassName('timeline');
}
function sliderDiv() {
  const sliders = document.getElementsByClassName('slider');
  expect(sliders.length).toEqual(1);
  return sliders[0];
}
function createMouseEvent(target, additionalData, eventType) {
  let data = {
    bubbles: true,
    cancelable: true,
    view: window,
    target,
    ...additionalData
  };

  if (eventType.startsWith('mouse')) {
    return new MouseEvent(eventType, data);
  }
  if (eventType.startsWith('touch')) {
    return new TouchEvent(eventType, data);
  }
  throw new Error('Unexpected event type.')
}
function mouseEventsAt(tickNum, numTicks, mouseEvents, additionalData) {
  /**
   * @param mouseEvents: an array of types of mouse events to create and dispatch
   * @param additionalData: additional data to get added to the mouse event
   */
  const target = sliderDiv();

  jest.spyOn(target, 'clientWidth', 'get').mockImplementation(() => 100*numTicks);

  mouseEvents.map((mouseEvent) => {
    const event = createMouseEvent(target, additionalData, mouseEvent);
    target.dispatchEvent(event);
  })
}
function clickOnTick(tickNum, numTicks) {
  mouseEventsAt(tickNum, numTicks, ['mousedown', 'mouseup'], {
    clientX: 100*tickNum
  });
}

describe('API basic tests', () => {
  test('Create entire timeline and do not crash', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5
    });
  });
  test('test animation and manually moving slider', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5
    });
    // Slider is at end on creation
    slider.animate('div-id');
    expect(ticks()[4].classList).toContain('slider-item-active');

    // Manually move to 0
    slider.moveSliderTo('div-id', 0);
    expect(ticks()[0].classList).toContain('slider-item-active');

    // Moves to 4 after animation
    slider.animate('div-id');
    expect(ticks()[4].classList).toContain('slider-item-active');
  });
  test('test timeline visibility', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3
    });

    const timeline = timelines()[0];
    expect(timeline.style.opacity).toEqual("0");
    slider.toggleTimelineVisibility('div-id');
    expect(timeline.style.opacity).toEqual("1");
    slider.toggleTimelineVisibility('div-id');
    expect(timeline.style.opacity).toEqual("0");
  });
});

describe('Interaction tests', () => {
  test('Dragging succeeds', () => {
    const numTicks = 5;
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      numTicks
    });

    expect(ticks()[numTicks-1].classList).toContain('slider-item-active');

    // Tap on tick 2 - tick 2 now active
    let tickNum = 2;
    mouseEventsAt(tickNum, numTicks, ['touchstart'], {
      targetTouches: [{clientX: 100*tickNum}]
    });
    expect(ticks()[tickNum].classList).toContain('slider-item-active');

    // Move to 4 - tick 4 now active
    tickNum = 4;
    mouseEventsAt(tickNum, numTicks, ['touchmove'], {
      targetTouches: [{clientX: 100*tickNum}]
    });
    expect(ticks()[tickNum].classList).toContain('slider-item-active');

    // Release - no change
    mouseEventsAt(tickNum, numTicks, ['touchend'], {
      targetTouches: [{clientX: 100*tickNum}]
    });
    expect(ticks()[tickNum].classList).toContain('slider-item-active');
  });
  test('Left and right arrows work', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5
    });

    const buttons = document.getElementsByClassName('prev-next-button');
    const [rightButton, leftButton] = buttons;

    expect(ticks()[4].classList).toContain('slider-item-active');
    leftButton.click();
    expect(ticks()[3].classList).toContain('slider-item-active');
    rightButton.click();
    expect(ticks()[4].classList).toContain('slider-item-active');
  });
  test('Question mark hover works', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5
    });

    const aQuestionMark = document.getElementsByClassName('question-mark')[0];

    expect(document.getElementById('timeline-info-tooltip')).toEqual(null);
    aQuestionMark.dispatchEvent(createMouseEvent(aQuestionMark, {}, 'mouseover'));
    expect(document.getElementById('timeline-info-tooltip')).not.toEqual(null);
    aQuestionMark.dispatchEvent(createMouseEvent(aQuestionMark, {}, 'mouseout'));
    expect(document.getElementById('timeline-info-tooltip')).toEqual(null);
  });
  test('Animation cancels if drag starts', () => {
    const mockCallback = jest.fn((value) => {
      if (value == 2) {
        // Move back to tick 1
        clickOnTick(1, 4);
      }
      // It should never hit 3 - only hits 0, 1, 2, and 4
      expect(value).not.toEqual(3);
    });

    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5,
      'sliderValueChanged': mockCallback
    });

    // start animating - the callback will cancel it
    slider.animate('div-id');

    // animation stopped after the first frame
    expect(ticks()[1].classList).toContain('slider-item-active');
  });
});


describe('wrapperDivId config', () => {
  test('Passing invalid div', () => {
    expect(() => {
      slider.createSliderAndTimeline({
        'wrapperDivId': 'not-div-id',
        'numTicks': 5
      });
    }).toThrow();
  });
  test('Missing parameter: div id', () => {
    expect(() => {
      slider.createSliderAndTimeline({
      'numTicks': 5
      });
    }).toThrow();
  });
});

describe('numTicks config', () => {
  test('Missing parameter: num ticks', () => {
    expect(() => {
      slider.createSliderAndTimeline({
        'wrapperDivId': 'div-id'
      });
    }).toThrow();
  });
});

describe('width config', () => {
  test('width as float controls maxWidth', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'width': 300
    });
    expect(div().style.maxWidth).toEqual('300px');
  });
  test('width as string controls maxWidth', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'width': '300px'
    });
    expect(div().style.maxWidth).toEqual('300px');
  });
});

describe('tickLabelPrefix config', () => {
  test('default tick label', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3
    });
    const labels = document.getElementsByClassName('timeline-header');
    expect(labels[0].textContent).toEqual('Round 1');
    expect(labels[1].textContent).toEqual('Round 2');
    expect(labels[2].textContent).toEqual('Round 3');
  });
  test('custom tick label', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'tickLabelPrefix': 'Year '
    });
    const labels = document.getElementsByClassName('timeline-header');
    expect(labels[0].textContent).toEqual('Year 1');
    expect(labels[1].textContent).toEqual('Year 2');
    expect(labels[2].textContent).toEqual('Year 3');
  });
});

describe('hideTimelineInitially config', () => {
  test('hidden timeline hides timeline', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3
    });
    const timeline = timelines()[0];
    expect(timeline.style.maxHeight).toEqual("0");
    expect(timeline.style.opacity).toEqual("0");
  });
  test('hidden timeline notifies slider', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3
    });
    const sliders = document.getElementsByClassName('slider');
    expect(sliders[0].classList).toContain("slider-when-timeline-hidden");
  });
  test('default hidden timeline', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'hideTimelineInitially': false
    });
    const timeline = timelines()[0];
    expect(timeline.style.maxHeight).not.toEqual("0");
    expect(timeline.style.opacity).not.toEqual("0");
  });
});

describe('sliderValueChanged config', () => {
  test('receive callback (& test clicks)', () => {
    const mockCallback = jest.fn();

    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'sliderValueChanged': mockCallback
    });

    // Called once on init
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe(2);

    clickOnTick(0, 3);
    clickOnTick(1, 3);
    clickOnTick(2, 3);

    expect(mockCallback.mock.calls.length).toBe(4);
    expect(mockCallback.mock.calls[1][0]).toBe(0);
    expect(mockCallback.mock.calls[2][0]).toBe(1);
    expect(mockCallback.mock.calls[3][0]).toBe(2);
  });
});

describe('tickText config', () => {
  test('Tick text as array', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'tickText': ['one', 'two', 'three']
    });

    expect(ticks()[0].textContent).toEqual('one');
    expect(ticks()[1].textContent).toEqual('two');
    expect(ticks()[2].textContent).toEqual('');
  });

  test('Tick text as string', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'tickText': 'hi'
    });

    expect(ticks()[0].textContent).toEqual('hi');
    expect(ticks()[1].textContent).toEqual('hi');
    expect(ticks()[2].textContent).toEqual('');
  });

  test('Tick text as invalid array', () => {
    expect(() => {
      slider.createSliderAndTimeline({
        'wrapperDivId': 'div-id',
        'numTicks': 3,
        'tickText': ['hi']
      });
    }).toThrow();
  });
});

describe('color config', () => {
  test('color as array', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'color': ['red', 'green', 'blue']
    });

    expect(ticks()[0].style.color).toEqual('red');
    expect(ticks()[1].style.color).toEqual('green');
    expect(ticks()[2].style.color).toEqual('blue');
  });

  test('Color as string', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'color': '#ff0000'
    });

    expect(ticks()[0].style.color).toEqual('rgb(255, 0, 0)');
    expect(ticks()[1].style.color).toEqual('rgb(255, 0, 0)');
    expect(ticks()[2].style.color).toEqual('rgb(255, 0, 0)');
  });

  test('Color as invalid array', () => {
    expect(() => {
      slider.createSliderAndTimeline({
        'wrapperDivId': 'div-id',
        'numTicks': 3,
        'color': ['hi']
      });
    }).toThrow();
  });

  test('Tick classes and colors correct as slider moves', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3
    });

    clickOnTick(1, 3);

    // colors don't change,
    expect(ticks()[0].style.color).toEqual('orangered');
    expect(ticks()[1].style.color).toEqual('orangered');
    expect(ticks()[2].style.color).toEqual('orangered');

    // but classes do
    expect(ticks()[0].classList).toContain('slider-item-past');
    expect(ticks()[1].classList).toContain('slider-item-active');
    expect(ticks()[2].classList).toContain('slider-item-future');
  });
});

describe('timelineData config', () => {
  test('data from readme', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 4,
      'timelineData': [ /* From README */
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
    });

    const timelineInfos = document.getElementsByClassName('timeline-info');

    expect(timelineInfos[0].textContent).toEqual('Event 1, tick 1');
    expect(timelineInfos[1].textContent).toEqual('Event 2, tick 1');
    expect(timelineInfos[2].textContent).toEqual('Event 1, tick 2');
    expect(timelineInfos[5].textContent).toEqual('Event 3, tick 4?');
  });
  test('invalid data', () => {
    expect(() => {
      slider.createSliderAndTimeline({
        'wrapperDivId': 'div-id',
        'numTicks': 1,
        'timelineData': [
          [
            {className: 'Event 1, tick 1'}
          ]
        ]
      });
    }).toThrow();
  });
  test('num ticks matches timeline data length', () => {
    expect(() => {
      slider.createSliderAndTimeline({
        'wrapperDivId': 'div-id',
        'numTicks': 4,
        'timelineData': []
      });
    }).toThrow();
  });
});

describe('animateOnLoad config', () => {
  test('ensure animates', () => {
    const mockCallback = jest.fn();
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 8,
      'sliderValueChanged': mockCallback,
      'animateOnLoad': true
    });

    // Once per round, and once when it was initially set to the last value
    expect(mockCallback.mock.calls.length).toBe(9);
  });
});

describe('timelinePeeking config', () => {
  test('ensure timelinePeeking peeks on animation', () => {
    let hasAnimationBegun = false;

    const mockCallback = jest.fn(() => {
      const timeline = timelines()[0];
      if (!hasAnimationBegun) {
        expect(timeline.style.opacity).toEqual('')
      } else {
        expect(timeline.style.opacity).toEqual('1')
      }
    });

    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 4,
      'sliderValueChanged': mockCallback,
      'timelinePeeking': true
    });

    hasAnimationBegun = true;

    expect(timelines()[0].style.opacity).toEqual('0');
    slider.animate('div-id');

  });
});

describe('hideActiveTickText config', () => {
  test('ensure ticktext can be visible when active', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'hideActiveTickText': false,
      'tickText': 'zooey'
    });

    const activeTicks = document.getElementsByClassName('slider-item');
    expect(activeTicks[0].textContent).toEqual('zooey');
    expect(activeTicks[1].textContent).toEqual('zooey');
    expect(activeTicks[2].textContent).toEqual('zooey');
  });
  test('ensure ticktext hidden by default', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 3,
      'tickText': 'zooey'
    });

    const activeTicks = document.getElementsByClassName('slider-item');
    expect(activeTicks[0].textContent).toEqual('zooey');
    expect(activeTicks[1].textContent).toEqual('zooey');
    expect(activeTicks[2].textContent).not.toEqual('zooey');
  });
});
