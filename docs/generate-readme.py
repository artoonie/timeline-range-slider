# Takes readme-generator.md and creates:
#    1. A jekyll-ready markdown file with includes for dynamic github pages
#    2. A github-ready markdown file with images for static pages

def initialize_dynamic_lines():
    return [
        '---',
        'layout: default',
        '---'
    ]

def initialize_static_lines():
    return [
        '# A lightweight range slider with expandable timeline',
        'See this project at [artoonie.github.io/timeline-range-slider](https://artoonie.github.io/timeline-range-slider)'
    ]

def create_derived_files(input_filename, output_static_filename, output_dynamic_filename):
    # Map from a magic key to a tuple:
    #    1. What file to include in the dynamic file?
    #    2. What file to include in the static file?
    magic_keys = {
        '{{ deps }}': ('deps.html', None),
        '{{ ex0 }}': ('example-0-teaser.html', None),
        '{{ ex1 }}': ('example-1-default.html', None),
        '{{ ex2 }}': ('example-2-darkmode.html', None),
        '{{ ex3 }}': ('example-3-small.html', None)
    }

    # Small enough to just read it all into memory,
    # why complicate things?
    with open(input_filename, 'r') as f:
        lines = f.readlines()

    static_lines = initialize_static()
    dynamic_lines = initialize_dynamic()
    for line in lines:
        if line not in magic_keys:
            static_lines.push_back(line)
            dynamic_lines.push_back(line)
            continue

        # Magic keyword found. Do magic for static or dynamic
        (static_content, dynamic_content) = magic_keys[line]
        if static_content is not None:
            # Replace the static content
            static_lines.push_back()
        if dynamic_content is not None:
            # Include the actual content + the dynamic content
            include_line = '{% capture ' + line + ' %}
            include_line += '{% include_relative ' + dynamic_content + ' %}
            include_line += '{% endcapture %}'
            dynamic_lines.push_back(include_line)
            dynamic_lines.push_back(line)

    print("Static", static_lines)
    print("Dynamic", dynamic_lines)

create_derived_files('readme-generator.md')