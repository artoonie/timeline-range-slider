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
function sliderDiv() {
  const sliders = document.getElementsByClassName('slider');
  expect(sliders.length).toEqual(1);
  return sliders[0];
}
function clickOn(target, additionalData) {
  let data = {
    bubbles: true,
    cancelable: true,
    view: window,
    target,
    ...additionalData
  };

  const mousedown = new MouseEvent('mousedown', data);
  const mouseup = new MouseEvent('mouseup', data);

  target.dispatchEvent(mousedown);
  target.dispatchEvent(mouseup);
}
function goToTick(tickNum, numTicks) {
  const target = sliderDiv();

  // set virtual width
  jest.spyOn(target, 'clientWidth', 'get').
       mockImplementation(() => 100*numTicks);

  // Called several more times after each click
  clickOn(target, {clientX: 100*tickNum})
}

describe('Simple', () => {
  test('Create entire timeline and do not crash', () => {
    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5
    });
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
    const labels = document.getElementsByClassName('timeline');
    expect(labels[0].style.maxHeight).toEqual("0");
    expect(labels[0].style.opacity).toEqual("0");
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
    const labels = document.getElementsByClassName('timeline');
    expect(labels[0].style.maxHeight).not.toEqual("0");
    expect(labels[0].style.opacity).not.toEqual("0");
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

    goToTick(0, 3);
    goToTick(1, 3);
    goToTick(2, 3);

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

    goToTick(1, 3);

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
  test('color as array', () => {
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
      const timelines = document.getElementsByClassName('timeline');
      if (!hasAnimationBegun) {
        expect(timelines[0].style.opacity).toEqual('')
      } else {
        expect(timelines[0].style.opacity).toEqual('1')
      }
    });

    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 4,
      'sliderValueChanged': mockCallback,
      'timelinePeeking': true
    });

    hasAnimationBegun = true;

    const timelines = document.getElementsByClassName('timeline');
    expect(timelines[0].style.opacity).toEqual('0');
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
