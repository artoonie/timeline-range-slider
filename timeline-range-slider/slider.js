/*
 * Global vars - storing data for callbacks
 */

/* Storing slider data. Maps element to info about it. */
let sliders = {}

/* Data about an in-progress mousedown or touchstart.
 * The id of this can index into sliders above. */
let activeSlideTarget = null;

/*
 * Functions for slider creation
 */

function createTick(sliderData, tickIndex) {
    /**
     * Creates a single tick mark
     */
    const maxWidth = sliderData.width / sliderData.numTicks;
    const tickColor = getColorFor(sliderData, tickIndex);
    const tickText = getTickTextFor(sliderData, tickIndex);

    let div = document.createElement('div');
    div.style.maxWidth = maxWidth + "px";
    div.style.color = tickColor;

    div.classList.add('slider-item');
    if (!sliderData.hideActiveTickText) {
      div.classList.add('slider-item-hidden-slider');
    }

    const newContent = document.createTextNode(tickText);
    div.appendChild(newContent);
    return div;
}

function setClassForElements(elements, classBaseName, tickValue) {
    /**
     * Updates a set of HTML elements to indicate the current tick value
     *
     * @param elements A list of elements to update class names
     * @param classBaseName the "base" of the class name, to which we will append
     *                      -past, -future, or -active depending on if its index
     *                      is before, after, or equal to tickValue
     * @param tickValue the active tick
     */

    const classNamePast = classBaseName + '-past';
    const classNameFuture = classBaseName + '-future';
    const classNameActive = classBaseName + '-active';

    // Set classes before the marker
    for(let i = 0; i < tickValue; ++i) {
        elements[i].classList.add(classNamePast);
        elements[i].classList.remove(classNameActive);
        elements[i].classList.remove(classNameFuture);
    }

    // Set classes after the marker
    for(let i = tickValue+1; i < elements.length; ++i) {
        elements[i].classList.remove(classNamePast);
        elements[i].classList.remove(classNameActive);
        elements[i].classList.add(classNameFuture);
    }

    elements[tickValue].classList.remove(classNamePast);
    elements[tickValue].classList.add(classNameActive);
    elements[tickValue].classList.remove(classNameFuture);
}

function getColorFor(sliderData, index) {
    return Array.isArray(sliderData.color) ? sliderData.color[index] : sliderData.color;
}

function getTickTextFor(sliderData, index) {
    return Array.isArray(sliderData.tickText) ? sliderData.tickText[index] : sliderData.tickText;
}

function setSliderValue(sliderData, value) {
    /**
     * Sets the value of the slider, updating classes and notifying the timeline
     */
    value = Math.min(value, sliderData.numTicks-1);
    value = Math.max(value, 0);

    if (sliderData.currentIndex == value) {
      return;
    }


    // Edit text for each tick
    if (sliderData.hideActiveTickText) {
      if (sliderData.currentIndex != null) {
          sliderData.ticks[sliderData.currentIndex].innerHTML = getTickTextFor(sliderData, sliderData.currentIndex);
      }
      sliderData.ticks[value].innerHTML = "";

      setClassForElements(sliderData.ticks, 'slider-item', value);
    } else {
      setClassForElements(sliderData.ticks, 'slider-item-hidden-slider', value);
    }

    sliderData.currentIndex = value;

    // Update the timeline with this value
    if (sliderData.isTimelineVisible) {
      updateTimeline(sliderData, value);
    }

    // Update the sliders with this value
    sliderData.leftArrow.disabled = value == 0
    sliderData.rightArrow.disabled = value == (sliderData.numTicks - 1)

    // Optional callback
    if (sliderData.sliderValueChanged) {
      // Request animation frame so repeated sliding triggers smooth callbacks
      window.requestAnimationFrame(
        function() { sliderData.sliderValueChanged(value); }
      );
    }
}

function clientXOfEvent(event) {
    /**
     * Gets the clientX of a mouseevent or a touchevent
     */
    if (event.targetTouches !== undefined) {
        return event.targetTouches[0].clientX;
    }
    return event.clientX;
}

function setPosition(event) {
    /**
     * Sets the active position of the slider based on an event
     */
    const rect = activeSlideTarget.getBoundingClientRect();
    const x = clientXOfEvent(event) - rect.left;
    const targetData = sliders[activeSlideTarget.id];

    const sliderWidth = targetData.sliderDiv.clientWidth;
    const widthPerTick = sliderWidth / targetData.numTicks;
    const value = Math.floor(x / widthPerTick);

    const sliderData = sliders[activeSlideTarget.id];
    setSliderValue(sliderData, value);

    sliderData.isAnimationInProgress = false;
}

function onSliderDrag(event) {
    setPosition(event);
}

function onSliderDragStart(event) {
    activeSlideTarget = event.target;
    document.addEventListener("mousemove", onSliderDrag);
    document.addEventListener("mouseup", onSliderDragEnd);
    document.addEventListener("touchmove", onSliderDrag);
    document.addEventListener("touchend", onSliderDragEnd);
    setPosition(event);

    // Prevent both mousedown and touchstart from firing
    event.preventDefault();
}

function onSliderDragEnd(event) {
    document.removeEventListener("mousemove", onSliderDrag);
    document.removeEventListener("mouseup", onSliderDragEnd);

    document.removeEventListener("touchmove", onSliderDrag);
    document.removeEventListener("touchend", onSliderDragEnd);
    document.removeEventListener("touchcancel", onSliderDragEnd);

    // Prevent both touchend and mouseup from firing
    event.preventDefault();
}

function ensureConfigCorrectSizeIfAList(config, configOption) {
  /**
   * Ensures config[configOptions] is of length numTicks if an array
   */
    if(Array.isArray(config[configOption])) {
        if (config[configOption].length !== config.numTicks) {
            throw new Error('color ' + configOption +
                            ' must be a string or a list of length numTicks')
        }
    }
}

function validateConfig(config) {
    // Validate timelineData
    if (config.timelineData.length !== config.numTicks) {
        throw new Error("timelineData length must be equal to numTicks")
    }
    config.timelineData.map(function(timelineDataOneTick){
        timelineDataOneTick.map(function(timelineDatum) {
            if (timelineDatum.summaryText === undefined) {
                throw new Error("Each timelineData must have a summary")
            }
        })
    })

    // Validate color and tickText
    ensureConfigCorrectSizeIfAList(config, 'color');
    ensureConfigCorrectSizeIfAList(config, 'tickText');

    // Fix width if given in pixels
    if (typeof config.width === 'number') {
        config.width += 'px';
    }
}

function setConfigDefaults(config) {
    /**
     * If any option is not provided, chooses a sane default
     * @param options A set of overriding config values, edits in-place
     * @throws Error if any required option is not provided
     */
    if (config.wrapperDivId === undefined) {
        throw new Error("wrapperDivId is required");
    }
    if (config.numTicks === undefined) {
        throw new Error("numTicks is required");
    }
    if (config.width === undefined) {
        config.width = 600;
    }
    if (config.tickLabelPrefix === undefined) {
        config.tickLabelPrefix = "Round ";
    }
    if (config.hideTimelineInitially === undefined) {
        config.hideTimelineInitially = true;
    }
    if (config.sliderValueChanged === undefined) {
        config.sliderValueChanged = null;
    }
    if (config.tickText === undefined) {
        config.tickText = "•";
    }
    if (config.color === undefined) {
        config.color = 'orangered';
    }
    if (config.timelineData === undefined) {
        config.timelineData = createFakeData(config.numTicks);
    }
    if (config.animateOnLoad === undefined) {
        config.animateOnLoad = false;
    }
    if (config.timelinePeeking === undefined) {
        config.timelinePeeking = true;
    }
    if (config.hideActiveTickText === undefined) {
        config.hideActiveTickText = true;
    }
    if (config.timeBetweenStepsMs === undefined) {
        // Take 1s total, but at least 100ms
        config.hideActiveTickText = Math.min(1000 / config.numTicks, 100);
    }

    validateConfig(config);
}

function expandTimeline(sliderData) {
    /**
     * Expands the timeline, updating classes, text, and borders
     */
    sliderData.expandCollapseDiv.innerHTML = '[—] Collapse Details';
    sliderData.timelineDiv.style.maxHeight = "999px";
    sliderData.timelineDiv.style.opacity = 1;
    sliderData.sliderDiv.classList.remove('slider-when-timeline-hidden');

    // Restore expanded padding + border
    if (sliderData.timelineDivExpandedPadding != null) {
      sliderData.timelineDiv.style.padding = sliderData.timelineDivExpandedPadding;
      sliderData.timelineDiv.style.border = sliderData.timelineDivExpandedBorder;
    }
    sliderData.isTimelineVisible = true;

    // Make sure the timeline is showing the right data
    updateTimeline(sliderData, sliderData.currentIndex);
}

function collapseTimeline(sliderData) {
    /**
     * Collapses the timeline, updating classes, text, and borders
     */

    // Store expanded padding + border
    sliderData.timelineDivExpandedPadding = sliderData.timelineDiv.style.padding;
    sliderData.timelineDivExpandedBorder = sliderData.timelineDiv.style.border;

    sliderData.expandCollapseDiv.innerHTML = '[+] Expand Details';
    sliderData.timelineDiv.style.maxHeight = 0;
    sliderData.timelineDiv.style.opacity = 0;
    sliderData.timelineDiv.style.padding = 0;
    sliderData.timelineDiv.style.border = 0;
    sliderData.sliderDiv.classList.add('slider-when-timeline-hidden');

    sliderData.isTimelineVisible = false;
}

function convertWrapperDivIdToSliderDivId(wrapperDivId) {
    /**
     * Creates a unique slider div ID given the wrapper div ID
     */
    return '_sliderDiv_' + wrapperDivId;
}

function createArrowIcon(innerHTML, onclick) {
    let btn = document.createElement('button');
    btn.className = 'prev-next-button';
    btn.onclick = onclick;
    btn.onKeyDown = onclick; // for accesibility / screenreaders
    btn.ariaLabel = "move to previous or next round";

    let a = document.createElement('a');
    a.innerHTML = innerHTML;
    btn.appendChild(a);
    return btn;
}

function createLeftArrow(sliderData) {
    let leftArrow = createArrowIcon('&#8249;', function() {
      setSliderValue(sliderData, sliderData.currentIndex-1);
    });
    leftArrow.style.float = "left";
    sliderData.leftArrow = leftArrow;
}

function createRightArrow(sliderData) {
    let rightArrow = createArrowIcon('&#8250;', function() {
      setSliderValue(sliderData, sliderData.currentIndex+1);
    });
    rightArrow.style.float = "right";
    sliderData.rightArrow = rightArrow;
}

function createSlider(sliderData, numTicks) {
    /**
     * Creates the slider element.
     * Fills out sliderData.ticks and sliderData.sliderDiv
     */
    let sliderDiv = document.createElement('div');
    sliderDiv.id = convertWrapperDivIdToSliderDivId(sliderData.id);
    sliderDiv.className = 'slider';

    let ticks = [];
    for (let i = 0; i < numTicks; ++i) {
        const tick = createTick(sliderData, i);
        const elem = sliderDiv.appendChild(tick);
        ticks.push(elem);
    }

    sliderDiv.addEventListener("touchstart", onSliderDragStart);
    sliderDiv.addEventListener("mousedown", onSliderDragStart);

    sliderData.ticks = ticks;
    sliderData.sliderDiv = sliderDiv;
}

function toggleTimelineVisibility(sliderData) {
    const isVisible = sliderData.isTimelineVisible;

    if (!isVisible) {
        expandTimeline(sliderData);
    } else {
        collapseTimeline(sliderData);
    }
}

function createExpandCollapseButton(sliderData) {
    /**
     * Creates the [+]/[-] Expand/Collapse Detail
     */
    let div = document.createElement('div');
    div.className = 'expand-collapse-button';

    sliderData.expandCollapseDiv = div;

    div.onclick = function() { toggleTimelineVisibility(sliderData); }
}

/*
 * Part 2 of this file: timeline functionality
 */
function updateTimeline(sliderData, value) {
    /**
     * Receives a notification from the slider that the slider changed
     */
    setClassForElements(sliderData.timelineDivsPerTick, 'timeline-column', value);

    // First, scroll immediately into view
    sliderData.timelineDivsPerTick[value].scrollIntoView({behavior: 'auto', inline: 'nearest', block: 'nearest'});
    // Then, scroll smoothly into center
    sliderData.timelineDivsPerTick[value].scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
}

function showHelpTooltip(event) {
    /**
     * Uses the data-label attribute and converts it to a tooltip
     */
    const helpText = event.target.getAttribute('data-label');

    let div = document.createElement('div');
    div.id = 'timeline-info-tooltip';
    div.innerHTML = helpText;
    div.style.position = 'fixed';
    div.style.left = (event.clientX+5) + 'px';
    div.style.top = (event.clientY-30) + 'px';

    // To ensure tooltip is never transparent,
    // find the first non-transparent element in the hierarchy and add it there
    const firstNonTransparentElement = event.target.parentElement.parentElement.parentElement;
    firstNonTransparentElement.appendChild(div);
}

function hideHelpTooltip() {
    /**
     * Hides the tooltip created by showHelpTooltip
     */
    document.getElementById('timeline-info-tooltip').remove();
}

function createTimeline(sliderData) {
    /**
     * Generates the timeline based on sliderData.timelineData
     */
    let timelineWrapper = document.createElement('div');

    let timelineDiv = document.createElement('div');
    timelineDiv.className = 'timeline';

    let timelineDivsPerTick = [];

    let floatWrap = document.createElement('div');
    floatWrap.style.float = "left";

    sliderData.timelineData.map(function(timelineDataOneTick, i) {
        let tickDiv = document.createElement('div');
        tickDiv.setAttribute('class', 'timeline-info-one-step');

        let headerDiv = document.createElement('div');
        headerDiv.innerHTML = sliderData.tickLabelPrefix + (i+1);
        headerDiv.setAttribute('class', 'timeline-header');
        tickDiv.appendChild(headerDiv);

        timelineDataOneTick.map(function(timelineDatum) {
            let div = document.createElement('div');
            div.innerHTML = timelineDatum.summaryText;
            div.classList.add('timeline-info');

            // Optional class name
            if (timelineDatum.className) {
                div.classList.add(timelineDatum.className);
            }

            // Optional tooltip
            if (timelineDatum.moreInfoText) {
                let moreInfoLink = document.createElement('button');
                moreInfoLink.innerHTML = '?';
                moreInfoLink.setAttribute('class', 'question-mark');
                moreInfoLink.setAttribute('data-label', timelineDatum.moreInfoText);
                moreInfoLink.onmouseover = showHelpTooltip;
                moreInfoLink.onmouseout = hideHelpTooltip;

                div.appendChild(moreInfoLink);
            }

            tickDiv.appendChild(div);
        })

        floatWrap.appendChild(tickDiv);
        timelineDivsPerTick.push(tickDiv);
    })

    floatWrap.style.width = "max-content";
    timelineDiv.appendChild(floatWrap);

    timelineWrapper.appendChild(timelineDiv);

    sliderData.timelineDivsPerTick = timelineDivsPerTick;
    sliderData.timelineDiv = timelineDiv;
    sliderData.timelineWrapper = timelineWrapper;
}

function createFakeData(numTicks) {
    const datumOptions = [{
        summaryText: "Something good",
        className: "timeline-info-good",
        moreInfoText: "Like a birth or the end of wars"
    }, {
        summaryText: "Something bad",
        className: "timeline-info-bad",
        moreInfoText: "As if millions of voices suddenly cried out in terror and were suddenly silenced"
    }, {
        summaryText: "Chance event!"
    },
    ]
    let allData = [];
    for(let i = 0; i < numTicks; ++i) {
        let timelineData = [];
        timelineData.push(datumOptions[Math.floor(Math.random()*3)]);
        timelineData.push(datumOptions[Math.floor(Math.random()*3)]);
        if (i % 2 === 0)
            timelineData.push(datumOptions[Math.floor(Math.random()*3)]);
        allData.push(timelineData);
    }
    return allData;
}

function animateFrontToBack(sliderData, completionCallback) {
    sliderData.isAnimationInProgress = true;

    let doCollapseTimelineWhenDone = false;
    if (sliderData.timelinePeeking && !sliderData.isTimelineVisible) {
        doCollapseTimelineWhenDone = true;
        expandTimeline(sliderData);
    }

    const animationDetails = {
      sliderData,
      index: 0,
      doCollapseTimelineWhenDone,
      completionCallback,
      timeBetweenStepsMs: sliderData.timeBetweenStepsMs,
      startTimestamp: null,
    };

    // First step is immediate, future steps follow timeBetweenStepsMs
    window.requestAnimationFrame(function(currentTimestamp) {
      animationStepRequested(animationDetails, currentTimestamp);
    });
}

function animationStepRequested(animationDetails, currentTimestamp) {
    setSliderValue(animationDetails.sliderData, animationDetails.index);

    if (animationDetails.index < animationDetails.sliderData.numTicks) {
        animationDetails.index += 1;
        scheduleNextAnimationStep(animationDetails, currentTimestamp);
    } else {
        animationDetails.sliderData.isAnimationInProgress = false;

        if (animationDetails.doCollapseTimelineWhenDone) {
            collapseTimeline(animationDetails.sliderData);
        }

        if (animationDetails.completionCallback !== undefined) {
            animationDetails.completionCallback(true);
        }
    }
}

function scheduleNextAnimationStep(animationDetails) {
    window.requestAnimationFrame(function(currentTimestamp) {
        if (animationDetails.startTimestamp === null)
            animationDetails.startTimestamp = currentTimestamp;
        const elapsed = currentTimestamp - animationDetails.startTimestamp;

        if (!animationDetails.sliderData.isAnimationInProgress) {
            // Canceled - don't collapse if user grabbed control
            if (animationDetails.completionCallback !== undefined) {
                animationDetails.completionCallback(false);
            }
            return;
        }

        if (elapsed < animationDetails.timeBetweenStepsMs) {
            scheduleNextAnimationStep(animationDetails);
            return;
        }

      animationDetails.startTimestamp = null;
      animationStepRequested(animationDetails, currentTimestamp);
    })
}

function sliderDataFromWrapperDivId(wrapperDivId) {
    const sliderId = convertWrapperDivIdToSliderDivId(wrapperDivId);
    return sliders[sliderId];
}

function sliderDataFromConfig(config) {
    setConfigDefaults(config);

    return {
        'id': config.wrapperDivId,
        'width': config.width,
        'numTicks': config.numTicks,
        'tickText': config.tickText,
        'color': config.color,
        'tickLabelPrefix': config.tickLabelPrefix,
        'sliderValueChanged': config.sliderValueChanged,
        'timelineData': config.timelineData,
        'timelinePeeking': config.timelinePeeking,
        'hideActiveTickText': config.hideActiveTickText,
        'timeBetweenStepsMs': config.timeBetweenStepsMs,
        'isAnimationInProgress': false,
        'isTimelineVisible': false, // false until it's created

        /* To be filled out by createSlider */
        'ticks': null,
        'sliderDiv': null,

        /* To be filled out by createTimeline */
        'currentIndex': null,
        'timelineDiv': null,
        'timelineWrapper': null,

        /* To be filled out by createLeftArrow / createRightArrow */
        'leftArrow': null,
        'rightArrow': null,

        /* To be filled out by createExpandCollapseButton */
        'expandCollapseDiv': null,

        /* To be filled out when contracting timeline */
        'timelineDivExpandedPadding': null,
        'timelineDivExpandedBorder': null,
    };
}

/**
 * Public methods below
 */

function trs_createSliderAndTimeline(config) {
    /**
     * Creates the slider and the timeline
     * @param options User-controlled options, see the README
     */
    let sliderData = sliderDataFromConfig(config);

    // Set style of outer div
    let outerDiv = document.getElementById(config.wrapperDivId);
    outerDiv.classList.add('trs-wrapper');
    outerDiv.style.maxWidth = config.width;

    // Create center div
    let centerDiv = document.createElement('div');
    centerDiv.className = 'center-div';

    // Create slider
    createSlider(sliderData, config.numTicks);
    centerDiv.appendChild(sliderData.sliderDiv);

    // Create timeline
    createTimeline(sliderData);
    centerDiv.appendChild(sliderData.timelineWrapper);

    // Create "Expand Details" button
    createExpandCollapseButton(sliderData);
    centerDiv.appendChild(sliderData.expandCollapseDiv);

    // Create left/right arrows and place all in outer div
    createLeftArrow(sliderData);
    createRightArrow(sliderData);
    outerDiv.appendChild(sliderData.rightArrow)
    outerDiv.appendChild(sliderData.leftArrow)
    outerDiv.appendChild(centerDiv)

    // Store data
    sliders[sliderData.sliderDiv.id] = sliderData;

    // Move slider to end
    setSliderValue(sliderData, config.numTicks-1);

    // Toggle visibility if requested
    if (config.hideTimelineInitially) {
        collapseTimeline(sliderData);
    } else {
        expandTimeline(sliderData);
    }

    if (config.animateOnLoad) {
        setSliderValue(sliderData, 0);
        animateFrontToBack(sliderData);
    }
}

function trs_animate(wrapperDivId, completionCallback) {
    animateFrontToBack(sliderDataFromWrapperDivId(wrapperDivId), completionCallback);
}

function trs_moveSliderTo(wrapperDivId, value) {
    setSliderValue(sliderDataFromWrapperDivId(wrapperDivId), value);
}

function trs_toggleTimelineVisibility(wrapperDivId) {
    toggleTimelineVisibility(sliderDataFromWrapperDivId(wrapperDivId));
}

// In case of node.js
/* eslint no-undef: ["off"] */
if (typeof exports !== typeof undefined) {
    exports.createSliderAndTimeline = trs_createSliderAndTimeline
    exports.moveSliderTo = trs_moveSliderTo
    exports.animate = trs_animate
    exports.toggleTimelineVisibility = trs_toggleTimelineVisibility
}
