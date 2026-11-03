require 'jekyll'
require 'json'
source = File.read('examples/page-archetypes/jekyll/_includes/examples/event-time.html')
template = Liquid::Template.parse(source)
STDIN.each_line do |line|
  value = JSON.parse(line)
  puts JSON.generate(template.render!({'include' => {'value' => value, 'display' => 'label', 'kind' => 'start'}}))
end
