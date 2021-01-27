/*
 * Part 1 of this file: Slide functionality
 */

/* Storing slider data. Maps element to info about it. */
let sliders = {}

/* Data about an in-progress mousedown or touchstart.
 * The id of this can index into sliders above. */
let activeSlideTarget = null;

function createTick(maxWidth, tickText, tickColor) {
    /**
     * Creates a single tick mark
     * @param {float} maxWidth maximum width of this tick
     * @param {string} tickText the tick marker text
     * @param {string} tickColor the color of active ticks
     * @return the div containing the tick
     */
    let div = document.createElement('div');
    div.setAttribute('class', 'slider-item');
    div.style.maxWidth = maxWidth + "px";
    div.style.color = tickColor;

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

function setSliderValue(sliderData, value) {
    /**
     * Sets the value of the slider, updating classes and notifying the timeline
     */
    value = Math.min(value, sliderData.ticks.length-1);
    value = Math.max(value, 0);

    setClassForElements(sliderData.ticks, 'slider', value);

    // Edit text for each tick
    if (sliderData.currentIndex != null) {
        sliderData.ticks[sliderData.currentIndex].innerHTML = sliderData.tickText;
    }
    sliderData.ticks[value].innerHTML = "";

    sliderData.currentIndex = value;

    // Update the timeline with this value
    if (sliderData.isTimelineVisible) {
      updateTimeline(sliderData, value);
    }

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

    const timelineWidth = targetData.sliderDiv.clientWidth;
    const widthPerTick = timelineWidth / targetData.ticks.length;
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

    // Validate color
    if(Array.isArray(config.color)) {
        if (config.color.length !== config.numTicks) {
            throw new Error('color config must be a string or a list of length numTicks')
        }
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
    if (config.showTimelineWhileAnimating === undefined) {
        config.showTimelineWhileAnimating = true;
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
    sliderData.sliderDiv.classList.remove('slider-when-timeline-visible');

    // Restore original padding + border
    if (sliderData.timelineDivOriginalPadding != null) {
      sliderData.timelineDiv.style.padding = sliderData.timelineDivOriginalPadding;
      sliderData.timelineDiv.style.border = sliderData.timelineDivOriginalBorder;
    }

    sliderData.isTimelineVisible = true;

    // Make sure the timeline is showing the right data
    updateTimeline(sliderData, sliderData.currentIndex);
}

function collapseTimeline(sliderData) {
    /**
     * Collapses the timeline, updating classes, text, and borders
     */

    // Store original padding + border to be restored during expansion
    sliderData.timelineDivOriginalPadding = sliderData.timelineDiv.style.padding;
    sliderData.timelineDivOriginalBorder = sliderData.timelineDiv.style.border;

    sliderData.expandCollapseDiv.innerHTML = '[+] Expand Details';
    sliderData.timelineDiv.style.maxHeight = 0;
    sliderData.timelineDiv.style.opacity = 0;
    sliderData.timelineDiv.style.padding = 0;
    sliderData.timelineDiv.style.border = 0;
    sliderData.sliderDiv.classList.add('slider-when-timeline-visible');

    sliderData.isTimelineVisible = false;
}

function convertWrapperDivIdToSliderDivId(wrapperDivId) {
    /**
     * Creates a unique slider div ID given the wrapper div ID
     */
    return '_sliderDiv_' + wrapperDivId;
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
    const maxWidth = sliderData.width / numTicks;
    for (let i = 0; i < numTicks; ++i) {
        const tickColor = Array.isArray(sliderData.color) ? sliderData.color[i] : sliderData.color;
        const tick = createTick(maxWidth, sliderData.tickText, tickColor);
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
                let moreInfoLink = document.createElement('a');
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
    timelineDiv.style.width = "100%";
    timelineDiv.appendChild(floatWrap);

    sliderData.timelineDivsPerTick = timelineDivsPerTick;
    sliderData.timelineDiv = timelineDiv;
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

function animateFrontToBack(sliderData) {
    sliderData.isAnimationInProgress = true;
    
    let doCollapseTimelineWhenDone = false;
    if (sliderData.showTimelineWhileAnimating && !sliderData.isTimelineVisible) {
        doCollapseTimelineWhenDone = true;
        expandTimeline(sliderData);
    }

    scheduleNextAnimationStep(sliderData, 0, doCollapseTimelineWhenDone);
}

function animationStepRequested(sliderData, index, doCollapseTimelineWhenDone, currentTimestamp) {
    setSliderValue(sliderData, index);

    if (index < sliderData.ticks.length) {
        scheduleNextAnimationStep(sliderData, index+1, doCollapseTimelineWhenDone, currentTimestamp);
    } else {
        sliderData.isAnimationInProgress = false;

        if (doCollapseTimelineWhenDone) {
            collapseTimeline(sliderData);
        }
    }
}

function scheduleNextAnimationStep(sliderData, index, doCollapseTimelineWhenDone, startTimestamp) {
    window.requestAnimationFrame(function(currentTimestamp) {
        if (startTimestamp === undefined)
            startTimestamp = currentTimestamp;
        const elapsed = currentTimestamp - startTimestamp;

        if (!sliderData.isAnimationInProgress) {
            // Canceled - don't collapse if user grabbed control
            return;
        }

        const timeBetweenSteps = Math.min(1000 / sliderData.ticks.length, 100);
        if (elapsed < timeBetweenSteps) { // Take 1s total, but at least 100ms
            triggerNextAnimation(sliderData, index, doCollapseTimelineWhenDone, startTimestamp);
            return;
        }

      animationStepRequested(sliderData, index, doCollapseTimelineWhenDone, currentTimestamp);
    })
}

function sliderDataFromWrapperDivId(wrapperDivId) {
    const sliderId = convertWrapperDivIdToSliderDivId(wrapperDivId);
    return sliders[sliderId];
}

/**
 * Public methods below
 */

function trs_createSliderAndTimeline(config) {
    /**
     * Creates the slider and the timeline
     * @param options User-controlled options, see the README
     */

    setConfigDefaults(config);

    // Set style of outer div
    let outerDiv = document.getElementById(config.wrapperDivId);
    outerDiv.style.maxWidth = config.width + "px";
    outerDiv.style.width = "100%";

    // Set up data
    let sliderData = {
        'id': config.wrapperDivId,
        'width': config.width,
        'tickText': config.tickText,
        'color': config.color,
        'tickLabelPrefix': config.tickLabelPrefix,
        'sliderValueChanged': config.sliderValueChanged,
        'timelineData': config.timelineData,
        'showTimelineWhileAnimating': config.showTimelineWhileAnimating,
        'isAnimationInProgress': false,
        'isTimelineVisible': false, // false until it's created

        /* To be filled out by createSlider */
        'ticks': null,
        'sliderDiv': null,

        /* To be filled out by createTimeline */
        'currentIndex': null,

        /* To be filled out by createExpandCollapseButton */
        'expandCollapseDiv': null,

        /* To be filled out when contracting timeline */
        'timelineDivOriginalPadding': null,
        'timelineDivOriginalBorder': null,
    };

    // Create slider
    createSlider(sliderData, config.numTicks);
    outerDiv.appendChild(sliderData.sliderDiv);

    // Create timeline
    createTimeline(sliderData);
    outerDiv.appendChild(sliderData.timelineDiv);

    // Create "Expand Details" button
    createExpandCollapseButton(sliderData);
    outerDiv.appendChild(sliderData.expandCollapseDiv);

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

function trs_animate(wrapperDivId) {
    animateFrontToBack(sliderDataFromWrapperDivId(wrapperDivId));
}

function trs_moveSliderTo(wrapperDivId, value) {
    setSliderValue(sliderDataFromWrapperDivId(wrapperDivId), value);
}

function trs_toggleTimelineVisibility(wrapperDivId) {
    toggleTimelineVisibility(sliderDataFromWrapperDivId(wrapperDivId));
}

// In case of node.js
if (typeof exports !== typeof undefined) {
    exports.createSliderAndTimeline = trs_createSliderAndTimeline
    exports.moveSliderTo = trs_moveSliderTo
    exports.animate = trs_animate
    exports.toggleTimelineVisibility = trs_toggleTimelineVisibility
}
