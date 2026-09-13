# Add a hosted test target on CI without requiring Xcode on the Windows host.
# The target loads the real app storyboard and checks the JS/native bridge.
require 'xcodeproj'
project_path = File.expand_path('../ios/App/App.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |target| target.name == 'App' }
raise 'App target missing' unless app
tests = project.targets.find { |target| target.name == 'AppTests' }
unless tests
  tests = project.new_target(:unit_test_bundle, 'AppTests', :ios, '13.0')
  tests.add_dependency(app)
  group = project.main_group.new_group('AppTests', 'AppTests')
  tests.add_file_references([group.new_file('NativeBridgeTests.swift')])
end
tests.build_configurations.each do |config|
  app_config = app.build_configurations.find { |item| item.name == config.name }
  config.base_configuration_reference = app_config.base_configuration_reference
  config.build_settings.merge!({
    'SWIFT_VERSION' => '5.0',
    'PRODUCT_NAME' => '$(TARGET_NAME)',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.vibeplayer.app.tests',
    'TEST_HOST' => '$(BUILT_PRODUCTS_DIR)/App.app/App',
    'BUNDLE_LOADER' => '$(TEST_HOST)',
    'LD_RUNPATH_SEARCH_PATHS' => '$(inherited) @executable_path/Frameworks @loader_path/Frameworks'
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(app)
scheme.add_build_target(tests)
scheme.add_test_target(tests)
scheme.set_launch_target(app)
scheme.save_as(project_path, 'AppSmokeTests', true)
