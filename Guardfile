# A sample Guardfile
# More info at https://github.com/guard/guard#readme

guard 'sass', 
	:input => 'css', 
	:output => 'css',
	:all_on_start => true,
	:smart_partials => false,
	:compass => true

guard 'livereload' do
  watch(%r{css/.*\.(css)$})
end

guard 'bundler' do
  watch('Gemfile')
  # Uncomment next line if Gemfile contain `gemspec' command
  # watch(/^.+\.gemspec/)
end
