require 'jekyll'
require 'json'
time_template = Liquid::Template.parse(File.read('examples/page-archetypes/jekyll/_includes/examples/event-time.html'))
order_template = Liquid::Template.parse(File.read('examples/page-archetypes/jekyll/_includes/examples/event-order.html'))
STDIN.each_line do |line|
  start_time, end_time = JSON.parse(line)
  markup = [start_time, end_time].map { |value| time_template.render!({'include' => {'value' => value, 'display' => 'label', 'kind' => 'start'}}) }
  puts JSON.generate(order_template.render!({'include' => {'start' => start_time, 'end' => end_time, 'start_markup' => markup[0], 'end_markup' => markup[1]}}))
end
