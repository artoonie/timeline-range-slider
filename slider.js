/*
 * Part 1 of this file: Slide functionality
 */

/* Storing slider data. Maps element to info about it. */
let sliders = {}

/* Data about an in-progress mousedown */
let activeSlideData = {}

function createTick(maxWidth) {
    /**
     * Creates a single tick mark
     * @param {float} maxWidth
     * @return the div containing the tick
     */
    let div = document.createElement('div');
    div.setAttribute('class', 'slider-item');
    div.style.maxWidth = maxWidth + "px";

    const newContent = document.createTextNode("•");
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

function setSliderValue(elem, value) {
    /**
     * Sets the value of the slider, updating classes and notifying the timeline
     */
    const sliderData = sliders[elem];

    value = Math.min(value, sliderData.ticks.length-1);
    value = Math.max(value, 0);

    setClassForElements(sliderData.ticks, 'slider', value);

    // Edit text for each tick
    if (sliderData.currentIndex != null) {
        sliderData.ticks[sliderData.currentIndex].innerHTML = "•";
    }
    sliderData.ticks[value].innerHTML = "";

    sliderData.currentIndex = value;

    notifySliderChangedTo(elem, value);
}

function setPosition(e) {
    /**
     * Sets the active position of the slider based on an event
     */
    const rect = activeSlideData.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const targetData = sliders[activeSlideData.target];

    const timelineWidth = targetData.sliderDiv.clientWidth;
    const widthPerTick = timelineWidth / targetData.ticks.length;
    const value = Math.floor(x / widthPerTick);

    setSliderValue(activeSlideData.target, value);
}

function onSliderDrag(event) {
    setPosition(event);
}

function onSliderDragStart(event) {
    activeSlideData = {
        'target': event.target
    };
    document.addEventListener("mousemove", onSliderDrag);
    document.addEventListener("mouseup", onSliderDragEnd);
    setPosition(event);
}

function onSliderDragEnd() {
    document.removeEventListener("mousemove", onSliderDrag);
    document.removeEventListener("mouseup", onSliderDragEnd);
}

function setConfigDefaults(config) {
    /**
     * If any option is not provided, chooses a sane default
     * @param options A set of overriding config values, edits in-place
     * @throws Error if any required option is not provided
     */
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
}

function expandTimeline(sliderData) {
    /**
     * Expands the timeline, updating classes, text, and borders
     */
    sliderData.expandCollapseDiv.innerHTML = '[-] Collapse Details';
    sliderData.timelineDiv.style.display = 'block';
    sliderData.sliderDiv.classList.remove('slider-when-timeline-visible');
}

function collapseTimeline(sliderData) {
    /**
     * Collapses the timeline, updating classes, text, and borders
     */
    sliderData.expandCollapseDiv.innerHTML = '[+] Expand Details';
    sliderData.timelineDiv.style.display = 'none';
    sliderData.sliderDiv.classList.add('slider-when-timeline-visible');
}

function createSlider(sliderData, numTicks) {
    /**
     * Creates the slider element.
     * Fills out sliderData.ticks and sliderData.sliderDiv
     */
    let sliderDiv = document.createElement('div');
    sliderDiv.className = 'slider';

    let ticks = [];
    const maxWidth = numTicks / sliderData.width;
    for (let i = 0; i < numTicks; ++i) {
        const tick = createTick(maxWidth);
        const elem = sliderDiv.appendChild(tick);
        ticks.push(elem);
    }

    sliderDiv.addEventListener("mousedown", onSliderDragStart);

    sliderData.ticks = ticks;
    sliderData.sliderDiv = sliderDiv;
}

function createExpandCollapseButton(sliderData) {
    /**
     * Creates the [+]/[-] Expand/Collapse Detail
     */
    let div = document.createElement('div');
    div.className = 'expand-collapse-button';

    sliderData.expandCollapseDiv = div;

    div.onclick = function() {
        if (sliderData.timelineDiv.style.display === 'none') {
            expandTimeline(sliderData);
        } else {
            collapseTimeline(sliderData);
        }

    }
}

function createSliderAndTimeline(outerDivId, config) {
    /**
     * Creates the slider and the timeline
     * @param outerDivId An empty div into which to place them
     * @param options User-controlled options, see the README
     */

    setConfigDefaults(config);

    // Set style of outer div
    let outerDiv = document.getElementById(outerDivId);
    outerDiv.style.maxWidth = config.width + "px";
    outerDiv.style.width = "100%";

    // Set up data
    let sliderData = {
        'width': config.width,

        /* To be filled out by createSlider */
        'ticks': null,
        'sliderDiv': null,

        /* To be filled out by createTimeline */
        'currentIndex': null,
        'timelineData': null,

        /* To be filled out by createExpandCollapseButton */
        'expandCollapseDiv': null
    };

    // Create slider
    createSlider(sliderData, config.numTicks);
    outerDiv.appendChild(sliderData.sliderDiv);

    // Create timeline
    createTimeline(sliderData, createFakeData(config.numTicks), config.width);
    outerDiv.appendChild(sliderData.timelineDiv);

    // Create "Expand Details" button
    createExpandCollapseButton(sliderData);
    outerDiv.appendChild(sliderData.expandCollapseDiv);

    // Store data
    sliders[sliderData.sliderDiv] = sliderData;

    if (config.hideTimelineInitially) {
        collapseTimeline(sliderData);
    } else {
        expandTimeline(sliderData);
    }

    // Move slider to end
    setSliderValue(sliderData.sliderDiv,config.numTicks-1);
}

/*
 * Part 2 of this file: timeline functionality
 */
function notifySliderChangedTo(elem, value) {
    /**
     * Receives a notification from the slider that the slider changed
     */
    const sliderData = sliders[elem];

    document.getElementById('round-number').innerHTML = "Round " + (value+1);

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
    div.style.top = event.target.getBoundingClientRect().top + "px";
    div.style.left = event.target.getBoundingClientRect().right + "px";

    // To ensure tooltip is never transparent,
    // find the first non-transparent element in the hierarchy
    const firstNonTransparentElement = event.target.parentElement.parentElement.parentElement;
    firstNonTransparentElement.appendChild(div);
}

function hideHelpTooltip() {
    /**
     * Hides the tooltip created by showHelpTooltip
     */
    document.getElementById('timeline-info-tooltip').remove();
}

function createTimeline(sliderData, listOfTickData) {
    /**
     * List of tick data is an array of length #ticks.
     * Each element is a list of objects describing the timeline of events that happened
     * on that tick. Each of those elements are object with fields:
     *  elem.summaryText
     *  elem.className
     *  elem.moreInfoText
     */
    let timelineDiv = document.createElement('div');
    timelineDiv.className = 'timeline';
    let timelineDivsPerTick = [];

    let floatWrap = document.createElement('div');
    floatWrap.style.float = "left";

    listOfTickData.map(function(tickData, i) {
        let tickDiv = document.createElement('div');
        tickDiv.setAttribute('class', 'timeline-info-one-step');

        let headerDiv = document.createElement('div');
        headerDiv.innerHTML = "Round " + (i+1);
        headerDiv.setAttribute('class', 'timeline-header');
        tickDiv.appendChild(headerDiv);

        tickData.map(function(tickDatum) {
            let div = document.createElement('div');
            div.setAttribute('class', 'timeline-info ' + tickDatum.className);
            div.innerHTML = tickDatum.summaryText;

            let moreInfoLink = document.createElement('a');
            moreInfoLink.innerHTML = '?';
            moreInfoLink.setAttribute('class', 'question-mark');
            moreInfoLink.setAttribute('data-label', tickDatum.moreInfoText);
            moreInfoLink.onmouseover = showHelpTooltip;
            moreInfoLink.onmouseout = hideHelpTooltip;

            div.appendChild(moreInfoLink);

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
        summaryText: "Someone elected",
        className: "timeline-info-elected",
        moreInfoText: "Someone reached a threshold!"
    }, {
        summaryText: "Someone eliminated",
        className: "timeline-info-eliminated",
        moreInfoText: "Someone all gone!"
    }, {
        summaryText: "Something else",
        className: "timeline-info-other-data",
        moreInfoText: "Some other thing happened"
    },
    ]
    let allData = [];
    for(let i = 0; i < numTicks; ++i) {
        let tickData = [];
        tickData.push(datumOptions[Math.floor(Math.random()*3)]);
        tickData.push(datumOptions[Math.floor(Math.random()*3)]);
        if (i % 2 === 0)
            tickData.push(datumOptions[Math.floor(Math.random()*3)]);
        allData.push(tickData);
    }
    return allData;
}

const config = {
    numTicks: 40,
    width: 600
}
createSliderAndTimeline('slider-timeline-wrapper', config);