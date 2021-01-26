const slider = require('./timeline-range-slider/slider.js');

test('Test and do not crash?', () => {
    document.body.innerHTML = '<div id="div-id"></div>'

    // See: https://github.com/jsdom/jsdom/issues/1695
    Element.prototype.scrollIntoView = jest.fn();

    slider.createSliderAndTimeline({
      'wrapperDivId': 'div-id',
      'numTicks': 5
    })
});

